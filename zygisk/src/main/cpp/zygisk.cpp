#include "zygisk.hpp"
#include "Dobby/include/dobby.h"
#include "pif_config.hpp"

#include <android/log.h>
#include <jni.h>
#include <string>
#include <string_view>
#include <sys/socket.h>
#include <sys/system_properties.h>
#include <sys/time.h>
#include <unistd.h>
#include <fcntl.h>
#include <vector>
#include <cstdio>
#include <cstring>

#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, "TeleInject", __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "TeleInject", __VA_ARGS__)

#define DEX_PATH      "/data/adb/modules/teleinject/classes.dex"
#define MODULE_PROP   "/data/adb/modules/teleinject/module.prop"
#define CONFIG_PATH   "/data/adb/modules/teleinject/telephony.conf"
#define CUSTOM_CONFIG "/data/adb/teleinject.conf"

namespace {

constexpr uint8_t COMMAND_LOAD_PAYLOAD = 1;
constexpr int PAYLOAD_TIMEOUT_MS = 5000;

JNIEnv *gEnv = nullptr;
pif::Config gConfig;
std::vector<uint8_t> gDexBytes;

using T_Callback = void (*)(void *, const char *, const char *, uint32_t);

T_Callback o_callback = nullptr;
void (*o_system_property_read_callback)(prop_info *, T_Callback, void *) = nullptr;

ssize_t xread(int fd, void *buffer, size_t count) {
    ssize_t total = 0; char *buf = (char*)buffer; size_t rem = count;
    while (rem > 0) {
        ssize_t r = TEMP_FAILURE_RETRY(read(fd, buf, rem));
        if (r < 0) return -1;
        if (r == 0) break;
        buf += r; total += r; rem -= r;
    }
    return total;
}
ssize_t xwrite(int fd, const void *buffer, size_t count) {
    ssize_t total = 0; const char *buf = (const char*)buffer; size_t rem = count;
    while (rem > 0) {
        ssize_t r = TEMP_FAILURE_RETRY(write(fd, buf, rem));
        if (r < 0) return -1;
        if (r == 0) break;
        buf += r; total += r; rem -= r;
    }
    return total;
}
bool readExact(int fd, void *buf, size_t s) { return xread(fd, buf, s) == (ssize_t)s; }
bool writeExact(int fd, const void *buf, size_t s) { return xwrite(fd, buf, s) == (ssize_t)s; }

void applySocketTimeout(int fd) {
    const timeval timeout{
            .tv_sec = PAYLOAD_TIMEOUT_MS / 1000,
            .tv_usec = (suseconds_t)((PAYLOAD_TIMEOUT_MS % 1000) * 1000),
    };
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));
    setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &timeout, sizeof(timeout));
}

bool readFileBytes(const char *p, std::vector<uint8_t> &out) {
    out.clear();
    int fd = open(p, O_RDONLY | O_CLOEXEC);
    if (fd < 0) return false;
    std::vector<uint8_t> buf(4096);
    ssize_t n = 0;
    while ((n = TEMP_FAILURE_RETRY(read(fd, buf.data(), buf.size()))) > 0) {
        out.insert(out.end(), buf.begin(), buf.begin() + n);
    }
    close(fd);
    return n == 0 && !out.empty();
}

bool loadConfigBytes(std::vector<uint8_t> &out) {
    if (readFileBytes(CUSTOM_CONFIG, out)) return true;
    return readFileBytes(CONFIG_PATH, out);
}

bool writeVector(int fd, const std::vector<uint8_t> &b) {
    const uint32_t s = (uint32_t)b.size();
    if (!writeExact(fd, &s, sizeof(s))) return false;
    return s == 0 || writeExact(fd, b.data(), s);
}
bool readVector(int fd, std::vector<uint8_t> &b) {
    uint32_t s = 0;
    if (!readExact(fd, &s, sizeof(s))) return false;
    b.resize(s);
    return s == 0 || readExact(fd, b.data(), s);
}

std::string telephonyMapToJson() {
    std::string j = "{";
    bool first = true;
    for (const auto &[k, v] : gConfig.telephonyMap) {
        if (!first) j += ",";
        first = false;
        j += "\"" + k + "\":\"" + v + "\"";
    }
    j += "}";
    return j;
}

std::string flagsToJson() {
    auto b = [](bool x){ return x ? "true" : "false"; };
    std::string j = "{";
    j += std::string("\"hookTelephonyManager\":") + b(gConfig.hookTelephonyManager) + ",";
    j += std::string("\"hookSubscriptionInfo\":") + b(gConfig.hookSubscriptionInfo) + ",";
    j += std::string("\"hookEmergencyNumber\":") + b(gConfig.hookEmergencyNumber) + ",";
    j += std::string("\"hookULocale\":") + b(gConfig.hookULocale) + ",";
    j += std::string("\"hookCellIdentity\":") + b(gConfig.hookCellIdentity);
    j += "}";
    return j;
}

struct PropMap { const char* prop; const char* configKey; };
static const PropMap kPropMappings[] = {
    {"gsm.operator.numeric",           "OPERATOR_NUMERIC"},
    {"gsm.operator.iso-country",       "NETWORK_COUNTRY_ISO"},
    {"gsm.operator.alpha",             "OPERATOR_NAME"},
    {"gsm.sim.operator.numeric",       "SIM_OPERATOR_NUMERIC"},
    {"gsm.sim.operator.iso-country",   "SIM_COUNTRY_ISO"},
    {"gsm.sim.operator.alpha",         "SIM_OPERATOR_NAME"},
    {"ril.operator.numeric",           "OPERATOR_NUMERIC"},
    {"ril.operator.iso-country",       "NETWORK_COUNTRY_ISO"},
    {"ril.operator.alpha",             "OPERATOR_NAME"},
    {"ril.sim.operator.numeric",       "SIM_OPERATOR_NUMERIC"},
    {"ril.sim.operator.iso-country",   "SIM_COUNTRY_ISO"},
    {"ril.sim.operator.alpha",         "SIM_OPERATOR_NAME"},
    {"ril.icc_operator_numeric",       "SIM_OPERATOR_NUMERIC"},
    {"ril.icc_operator_iso_country",   "SIM_COUNTRY_ISO"},
    {"ril.icc_operator_alpha",         "SIM_OPERATOR_NAME"},
    {"ro.csc.country_code",            "COUNTRY_CODE"},
    {"ro.csc.countryiso_code",         "COUNTRY_ISO"},
    {"ro.csc.sales_code",              "OPERATOR_NAME"},
    {"ro.boot.csc_sales_code",         "OPERATOR_NAME"},
};

// Build props for Pixel spoofing (Play Integrity)
struct BuildPropMap { const char* prop; std::string pif::Config::*field; };
static const BuildPropMap kBuildPropMappings[] = {
    {"ro.build.fingerprint",           &pif::Config::fingerprint},
    {"ro.product.model",               &pif::Config::model},
    {"ro.product.name",                &pif::Config::product},
    {"ro.product.brand",               &pif::Config::brand},
    {"ro.product.device",              &pif::Config::device},
    {"ro.product.manufacturer",        &pif::Config::manufacturer},
    {"ro.build.version.security_patch",&pif::Config::securityPatch},
    {"ro.product.first_api_level",     &pif::Config::deviceInitialSdkInt},
};

static const char* lookupSpoofValue(const std::string_view& propName) {
    if (!gConfig.spoofTelephony && !gConfig.spoofBuild) return nullptr;
    bool sem = (propName.find("ril.") == 0 || propName.find("ro.csc") == 0
                || propName.find("ro.boot.csc") == 0);
    if (sem && !gConfig.hookSemTelephonyProps) goto check_build;
    if (!sem && !gConfig.hookTelephonyProperties) goto check_build;

    for (const auto& m : kPropMappings) {
        if (!m.configKey) continue;
        if (propName == m.prop) {
            auto it = gConfig.telephonyMap.find(m.configKey);
            if (it != gConfig.telephonyMap.end() && !it->second.empty()) {
                return it->second.c_str();
            }
        }
    }

check_build:
    if (gConfig.spoofBuild) {
        for (const auto& m : kBuildPropMappings) {
            if (propName == m.prop && !(gConfig.*m.field).empty()) {
                return (gConfig.*m.field).c_str();
            }
        }
    }
    return nullptr;
}

void modifyCallback(void *cookie, const char *name, const char *value, uint32_t serial) {
    if (!cookie || !name || !value || !o_callback) return;

    const char *oldValue = value;
    const std::string_view prop(name);
    if (const char* spoof = lookupSpoofValue(prop); spoof) {
        value = spoof;
    }

    if (gConfig.debug && strcmp(oldValue, value) != 0) {
        LOGD("[%s]: %s -> %s", name, oldValue, value);
    }
    o_callback(cookie, name, value, serial);
}

void systemPropertyReadCallback(prop_info *pi, T_Callback callback, void *cookie) {
    if (pi && callback && cookie) o_callback = callback;
    o_system_property_read_callback(pi, modifyCallback, cookie);
}

bool doHookProperty() {
    void *ptr = DobbySymbolResolver(nullptr, "__system_property_read_callback");
    if (ptr && DobbyHook(ptr, (void*)systemPropertyReadCallback,
                         (void**)&o_system_property_read_callback) == 0) {
        LOGD("hooked __system_property_read_callback at %p", ptr);
        return true;
    }
    LOGE("hook __system_property_read_callback failed");
    return false;
}

void injectDex() {
    if (gDexBytes.empty()) {
        LOGD("[INJECT] no dex payload available");
        return;
    }

    jclass classLoaderClass = gEnv->FindClass("java/lang/ClassLoader");
    jmethodID getSystemClassLoader = gEnv->GetStaticMethodID(
            classLoaderClass, "getSystemClassLoader", "()Ljava/lang/ClassLoader;");
    jobject systemClassLoader = gEnv->CallStaticObjectMethod(classLoaderClass, getSystemClassLoader);
    if (gEnv->ExceptionCheck()) { gEnv->ExceptionClear(); return; }

    jobject dexBuffer = gEnv->NewDirectByteBuffer(gDexBytes.data(), (jlong)gDexBytes.size());
    jclass inMem = gEnv->FindClass("dalvik/system/InMemoryDexClassLoader");
    jmethodID inMemInit = gEnv->GetMethodID(
            inMem, "<init>", "(Ljava/nio/ByteBuffer;Ljava/lang/ClassLoader;)V");
    jobject loader = gEnv->NewObject(inMem, inMemInit, dexBuffer, systemClassLoader);
    if (gEnv->ExceptionCheck()) { gEnv->ExceptionClear(); return; }

    jmethodID loadClass = gEnv->GetMethodID(
            classLoaderClass, "loadClass", "(Ljava/lang/String;)Ljava/lang/Class;");
    jstring entryClassName = gEnv->NewStringUTF("es.chiteroman.playintegrityfix.EntryPoint");
    jobject entryClassObject = gEnv->CallObjectMethod(loader, loadClass, entryClassName);
    if (gEnv->ExceptionCheck()) { gEnv->ExceptionClear(); return; }

    jclass entryPointClass = (jclass)entryClassObject;
    jmethodID entryInit = gEnv->GetStaticMethodID(entryPointClass, "init",
        "(Ljava/lang/String;Ljava/lang/String;)V");
    const std::string telephonyJson = telephonyMapToJson();
    const std::string flagsJson = flagsToJson();
    jstring jt = gEnv->NewStringUTF(telephonyJson.c_str());
    jstring jf = gEnv->NewStringUTF(flagsJson.c_str());
    gEnv->CallStaticVoidMethod(entryPointClass, entryInit, jt, jf);
    if (gEnv->ExceptionCheck()) {
        gEnv->ExceptionDescribe();
        gEnv->ExceptionClear();
    }
    gEnv->DeleteLocalRef(jt);
    gEnv->DeleteLocalRef(jf);
    gEnv->DeleteLocalRef(entryClassObject);
    gEnv->DeleteLocalRef(entryClassName);
    gEnv->DeleteLocalRef(loader);
    gEnv->DeleteLocalRef(inMem);
    gEnv->DeleteLocalRef(dexBuffer);
    gEnv->DeleteLocalRef(systemClassLoader);
    gEnv->DeleteLocalRef(classLoaderClass);
}

bool requestPayload(int fd) {
    if (fd < 0) return false;
    applySocketTimeout(fd);
    bool ok = writeExact(fd, &COMMAND_LOAD_PAYLOAD, sizeof(COMMAND_LOAD_PAYLOAD));
    bool companionOk = false;
    ok = ok && readExact(fd, &companionOk, sizeof(companionOk));
    if (!ok || !companionOk) { close(fd); return false; }

    ok = readConfig(fd, gConfig);
    if (ok && gConfig.needsDex()) {
        ok = readVector(fd, gDexBytes);
    } else {
        gDexBytes.clear();
    }
    close(fd);
    if (!ok) { gDexBytes.clear(); gConfig = {}; return false; }
    return true;
}

void companion(int fd) {
    applySocketTimeout(fd);
    uint8_t command = 0;
    bool ok = readExact(fd, &command, sizeof(command)) && command == COMMAND_LOAD_PAYLOAD;

    std::vector<uint8_t> cfgBytes;
    std::vector<uint8_t> dexBytes;
    pif::Config config;

    if (ok) ok = loadConfigBytes(cfgBytes);
    if (ok) {
        const std::string_view view((const char*)cfgBytes.data(), cfgBytes.size());
        config = pif::parseConfig(view);
    }
    if (ok && config.needsDex()) ok = readFileBytes(DEX_PATH, dexBytes);

    writeExact(fd, &ok, sizeof(ok));
    if (!ok) return;

    ok = writeConfig(fd, config);
    if (ok && config.needsDex()) ok = writeVector(fd, dexBytes);
    if (!ok) LOGE("[COMPANION] failed to send payload");
}

}

using namespace zygisk;

class TeleInjectModule : public ModuleBase {
public:
    void onLoad(Api *api_, JNIEnv *env_) override {
        api = api_;
        env = env_;
    }

    void preAppSpecialize(AppSpecializeArgs *args) override {
        payloadLoaded = false;
        appAllowed = false;
        gConfig = {};
        gDexBytes.clear();

        if (!args) {
            api->setOption(DLCLOSE_MODULE_LIBRARY);
            return;
        }

        std::string name;
        const char *raw = env->GetStringUTFChars(args->nice_name, nullptr);
        if (raw) {
            name = raw;
            env->ReleaseStringUTFChars(args->nice_name, raw);
        }
        if (name.empty()) {
            api->setOption(DLCLOSE_MODULE_LIBRARY);
            return;
        }

        payloadLoaded = requestPayload(api->connectCompanion());
        if (!payloadLoaded || (!gConfig.spoofTelephony && !gConfig.spoofBuild)) {
            api->setOption(DLCLOSE_MODULE_LIBRARY);
            payloadLoaded = false;
            return;
        }

        appAllowed = gConfig.isAllowed(name) || gConfig.isAllowed("*");
        if (!appAllowed) {
            api->setOption(DLCLOSE_MODULE_LIBRARY);
            return;
        }

        api->setOption(FORCE_DENYLIST_UNMOUNT);
        currentPackage = name;
    }

    void postAppSpecialize(const AppSpecializeArgs *args) override {
        if (!payloadLoaded || !appAllowed) return;
        gEnv = env;

        if (gConfig.debug) {
            LOGD("[APP] hooking %s", currentPackage.c_str());
        }

        if (gConfig.needsDex()) {
            injectDex();
        }
        if (gConfig.needsPropertyHook()) {
            doHookProperty();
        }
    }

    void preServerSpecialize(ServerSpecializeArgs *args) override {
        api->setOption(DLCLOSE_MODULE_LIBRARY);
    }

private:
    Api *api = nullptr;
    JNIEnv *env = nullptr;
    bool payloadLoaded = false;
    bool appAllowed = false;
    std::string currentPackage;
};

REGISTER_ZYGISK_MODULE(TeleInjectModule)
REGISTER_ZYGISK_COMPANION(companion)
#pragma once

#include <string>
#include <string_view>
#include <unordered_map>
#include <unordered_set>

namespace pif {
    struct Config {
        std::unordered_map<std::string, std::string> telephonyMap;

        // ---- Pixel / Build spoofing (Play Integrity Fix) ----
        bool spoofBuild      = true;
        bool spoofProps      = false;
        bool spoofProvider   = false;
        bool spoofSignature  = false;

        std::string fingerprint;
        std::string model;
        std::string product;
        std::string brand;
        std::string device;
        std::string manufacturer;
        std::string securityPatch;
        std::string deviceInitialSdkInt;

        bool spoofTelephony = true;

        // Per-class hook toggles
        bool hookTelephonyManager      = true;
        bool hookSubscriptionInfo      = true;
        bool hookEmergencyNumber       = true;
        bool hookTelephonyProperties   = true;
        bool hookSemTelephonyProps     = true;
        bool hookULocale               = true;
        bool hookCellIdentity          = true;

        std::unordered_set<std::string> allowedApps;
        bool debug = false;

        [[nodiscard]] bool needsDex() const {
            return spoofTelephony && (hookTelephonyManager || hookSubscriptionInfo
                || hookEmergencyNumber || hookULocale || hookCellIdentity);
        }
        [[nodiscard]] bool needsPropertyHook() const {
            return (spoofTelephony && (hookTelephonyProperties || hookSemTelephonyProps))
                || spoofBuild;
        }
        [[nodiscard]] bool isAllowed(const std::string& pkg) const {
            return allowedApps.find(pkg) != allowedApps.end();
        }
    };

    [[nodiscard]] Config parseConfig(std::string_view content);
    [[nodiscard]] bool writeConfig(int fd, const Config &config);
    [[nodiscard]] bool readConfig(int fd, Config &config);
}
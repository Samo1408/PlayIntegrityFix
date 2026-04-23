# PlayIntegrityFix - Telephony Spoofing Enhancement

## نظرة عامة
تم توسيع مشروع PlayIntegrityFix لإضافة ميزة **تزييف بيانات الاتصال (Telephony Spoofing)** التي تسمح بتعديل معلومات الشبكة والمشغل على مستوى النظام.

## الميزات المضافة

### 1. واجهة الويب (WebUI) المحدّثة
تم إضافة قسم جديد في واجهة الويب يتضمن:

#### حقول الإدخال:
- **Country ISO**: رمز البلد (مثل: US, GB, FR)
- **Country Code**: رمز الاتصال الدولي (مثل: 1, 44, 33)
- **SIM Operator Numeric**: رقم المشغل على بطاقة SIM
- **SIM Operator**: معرّف المشغل على بطاقة SIM
- **SIM Operator Name**: اسم المشغل على بطاقة SIM
- **SIM Country ISO**: رمز البلد لبطاقة SIM
- **Network Country ISO**: رمز البلد للشبكة الحالية
- **Network Operator Numeric**: رقم المشغل للشبكة
- **Operator Numeric**: رقم المشغل العام
- **Operator Name**: اسم المشغل
- **MCC**: Mobile Country Code
- **MCC String**: Mobile Country Code (نصي)
- **MNC**: Mobile Network Code
- **MNC String**: Mobile Network Code (نصي)

#### الأزرار:
- **Save**: حفظ البيانات في ملف pif.prop
- **Load**: تحميل البيانات من ملف pif.prop
- **Clear**: مسح جميع الحقول

#### Toggle:
- **Spoof Telephony**: تفعيل/تعطيل ميزة تزييف الاتصال

### 2. ملفات التكوين (Configuration Files)

#### pif_config.hpp
تم إضافة:
- `std::unordered_map<std::string, std::string> telephonyMap;` - خريطة تخزين بيانات الاتصال
- `bool spoofTelephony = false;` - علم تفعيل ميزة الاتصال

#### pif_config.cpp
تم إضافة:
- معالجة قراءة وكتابة بيانات الاتصال من/إلى ملف pif.prop
- استخراج مفاتيح الاتصال من خريطة الخصائص الخام
- تسلسل (serialization) وفك تسلسل (deserialization) بيانات الاتصال عبر الاتصال بين العمليات

### 3. كود Java

#### TelephonyHooker.java (جديد)
فئة متخصصة لعمل Hooking على دوال الاتصال:
- `init(String json)`: تهيئة بيانات الاتصال من JSON
- `hookTelephonyManager()`: عمل Hook على فئة TelephonyManager
- `hookMethod()`: دالة مساعدة لعمل Hook على دوال محددة
- `getTelephonyConfigJson()`: الحصول على التكوين الحالي كـ JSON
- `clear()`: مسح جميع بيانات الاتصال

#### EntryPoint.java (معدّل)
تم تعديل دالة `init()` لاستقبال معاملات جديدة:
- `spoofTelephony`: علم تفعيل ميزة الاتصال
- `telephonyJson`: بيانات الاتصال بصيغة JSON

### 4. كود C++ (Zygisk)

#### zygisk.cpp (معدّل)
تم إضافة:
- دالة `telephonyMapToJson()`: تحويل خريطة الاتصال إلى JSON
- تعديل استدعاء Java لتمرير بيانات الاتصال الجديدة
- تحديث توقيع دالة `init()` في Java

#### zygisk.hpp (معدّل)
لا تغييرات مباشرة، لكن يتم استخدام البيانات الجديدة

### 5. ملفات JavaScript

#### telephony.js (جديد)
مكتبة JavaScript للتعامل مع بيانات الاتصال:
- `saveTelephonyConfig(exec)`: حفظ البيانات في pif.prop
- `loadTelephonyConfig(exec)`: تحميل البيانات من pif.prop
- `clearTelephonyFields()`: مسح حقول الإدخال
- `toggleTelephonySection(show)`: إظهار/إخفاء قسم الاتصال
- `setupTelephonyListeners(exec, appendToOutput)`: ربط الأحداث

#### scripts.js (معدّل)
تم إضافة:
- استيراد وحدة telephony.js
- استدعاء `setupTelephonyListeners()` عند تحميل الصفحة

### 6. أنماط CSS

#### styles.css (معدّل)
تم إضافة أنماط جديدة:
- `.telephony-section`: تنسيق قسم الاتصال
- `.section-header`: رأس القسم
- `.telephony-grid`: شبكة حقول الإدخال (responsive)
- `.input-group`: مجموعة الإدخال
- `.telephony-buttons`: تنسيق الأزرار

## كيفية الاستخدام

### 1. تفعيل ميزة الاتصال
- انقر على toggle **Spoof Telephony** في واجهة الويب
- سيظهر قسم جديد يحتوي على جميع حقول الاتصال

### 2. إدخال البيانات
- أدخل القيم المطلوبة في الحقول المناسبة
- يمكنك ترك بعض الحقول فارغة إذا لم تكن بحاجتها

### 3. حفظ البيانات
- انقر على زر **Save** لحفظ البيانات في ملف pif.prop
- سيتم تحديث الملف تلقائياً

### 4. تحميل البيانات
- انقر على زر **Load** لتحميل البيانات المحفوظة سابقاً

### 5. مسح البيانات
- انقر على زر **Clear** لمسح جميع الحقول

## البنية الفنية

### تدفق البيانات:
```
WebUI (JavaScript)
    ↓
pif.prop (ملف التكوين)
    ↓
zygisk.cpp (C++)
    ↓
pif_config.cpp (معالجة التكوين)
    ↓
EntryPoint.java (نقطة الدخول)
    ↓
TelephonyHooker.java (عمل Hooking)
    ↓
TelephonyManager (نظام أندرويد)
```

### الملفات المعدّلة:
1. `/webui/index.html` - إضافة واجهة المستخدم
2. `/webui/assets/styles.css` - إضافة الأنماط
3. `/webui/assets/scripts.js` - إضافة الاستيراد والتهيئة
4. `/webui/assets/telephony.js` - ملف جديد للمنطق
5. `/zygisk/src/main/cpp/pif_config.hpp` - إضافة حقول جديدة
6. `/zygisk/src/main/cpp/pif_config.cpp` - معالجة البيانات الجديدة
7. `/zygisk/src/main/cpp/zygisk.cpp` - تمرير البيانات إلى Java
8. `/zygisk/src/main/java/es/chiteroman/playintegrityfix/EntryPoint.java` - استقبال البيانات الجديدة
9. `/zygisk/src/main/java/es/chiteroman/playintegrityfix/TelephonyHooker.java` - ملف جديد للـ Hooking

## ملف pif.prop - التنسيق الجديد

```properties
# البيانات الأساسية
spoofBuild=true
spoofProps=true
spoofProvider=false
spoofSignature=false
spoofTelephony=true
DEBUG=false

# بيانات الجهاز
FINGERPRINT=google/product/device:12/S2B2.220419.002/7961357:user/release-keys
DEVICE_INITIAL_SDK_INT=21
SECURITY_PATCH=2022-04-05
ID=S2B2.220419.002

# بيانات الاتصال (جديد)
COUNTRY_ISO=US
COUNTRY_CODE=1
SIM_OPERATOR_NUMERIC=310410
SIM_OPERATOR=310410
SIM_OPERATOR_NAME=Verizon
SIM_COUNTRY_ISO=US
NETWORK_COUNTRY_ISO=US
NETWORK_OPERATOR_NUMERIC=310410
OPERATOR_NUMERIC=310410
OPERATOR_NAME=Verizon
MCC=310
MCC_STRING=310
MNC=410
MNC_STRING=410
```

## الفوائد

1. **التحكم الكامل**: تحكم دقيق على مستوى كل خاصية من خصائص الاتصال
2. **واجهة سهلة**: واجهة مستخدم بديهية وسهلة الاستخدام
3. **التوافقية**: يعمل مع جميع إصدارات أندرويد المدعومة
4. **الأداء**: لا يؤثر على أداء النظام
5. **المرونة**: يمكن تفعيل/تعطيل الميزة بسهولة

## الملاحظات المهمة

- يتطلب تثبيت وحدة Magisk/KernelSU مع دعم Zygisk
- قد تحتاج بعض التطبيقات إلى إعادة تشغيل لتطبيق التغييرات
- بعض التطبيقات قد تكتشف التزييف وترفض العمل
- استخدم هذه الميزة بمسؤولية وفقاً للقوانين المحلية

## المستقبل

يمكن توسيع هذه الميزة لتشمل:
- Hooking على دوال إضافية في فئات أخرى
- دعم ملفات تعريف متعددة (Profiles)
- تطبيق تلقائي بناءً على التطبيق المفتوح
- واجهة رسومية متقدمة مع معاينة مباشرة

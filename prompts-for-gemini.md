# Minecraft Launcher Geliştirme - Gemini Prompt'ları

Bu dosyadaki prompt'ları sırayla Gemini'ye yapıştırarak adım adım Minecraft Launcher'ını inşa edebilirsin.

---

## Prompt 1: Proje Mimarisi ve Tech Stack

```
Ben bir Minecraft Launcher yapmak istiyorum. Windows için Electron + React + TypeScript kullanacağım.
Proje mimarisini şu şekilde düşünüyorum:
- Electron main process (Node.js) -> Minecraft sürüm yönetimi, dosya indirme, oyun başlatma
- React renderer -> Kullanıcı arayüzü (login, sürüm seçimi, ayarlar)

Bana şu konularda detaylı bir plan ver:
1. Proje klasör yapısı nasıl olmalı?
2. Hangi npm paketlerini kullanmalıyım?
3. Electron main ve renderer process arasındaki IPC iletişimi nasıl tasarlanmalı?
4. Minecraft'ın resmi API'leri (version manifest, assets, authentication) nelerdir?
```

---

## Prompt 2: Microsoft OAuth2 Authentication

```
Minecraft Launcher için Microsoft OAuth 2.0 ile kullanıcı girişi yapmam gerekiyor.

Bana şu akışı kodla anlat:
1. Microsoft Azure'da nasıl App Registration oluştururum?
2. OAuth2 PKCE flow nasıl çalışır?
3. Minecraft, Xbox Live ve Microsoft token zinciri nasıl kurulur?
   (Microsoft token -> Xbox Live token -> XSTS token -> Minecraft token -> Minecraft profile)
4. Electron'da tarayıcı tabanlı OAuth nasıl yapılır? (Electron'un auth penceresi ile)

TypeScript ile yaz, kod örnekleri ver.
```

---

## Prompt 3: Minecraft Sürüm Yönetimi

```
Minecraft Launcher'da sürüm yönetimi için şunları yapmam gerekiyor:

1. https://launchermeta.mojang.com/mc/game/version_manifest.json adresinden sürüm listesini çekmek
2. Seçilen sürümün JSON manifest'ini indirip parse etmek
3. Gerekli libraries, assets ve client.jar dosyalarını indirmek
4. Tüm dosyaları doğru klasör yapısına yerleştirmek

Node.js/TypeScript ile bu işlemleri yapan bir VersionManager sınıfı yaz.
Download işlemleri için progress bar ve retry mekanizması olsun.
Paralel indirme desteği de ekle.
```

---

## Prompt 4: Java Runtime Yönetimi

```
Minecraft Launcher için Java runtime yönetimi yapmam gerekiyor:

1. Sistemde yüklü Java sürümlerini tespit etme
2. Minecraft'ın ihtiyaç duyduğu Java sürümünü belirleme (Minecraft 1.17+ Java 17, 1.20.5+ Java 21)
3. Gerekli Java yoksa Adoptium/Eclipse Temurin'den otomatik indirme
4. Java path'ini oyun başlatma argümanlarına ekleme

Bunu TypeScript ile yaz. Java detection için registry ve PATH kontrolü, 
indirme için Adoptium API (https://api.adoptium.net) kullan.
```

---

## Prompt 5: Oyun Başlatma (Game Launch)

```
Minecraft'ı başlatmak için bir LaunchManager sınıfı yaz. Gereksinimler:

1. Minecraft sürüm JSON'undan JVM argümanlarını ve game argümanlarını oluşturma
2. Classpath oluşturma (tüm library'leri ve client.jar'ı ekleme)
3. Native library'leri (LWJGL) doğru klasöre çıkarma
4. child_process.spawn ile Minecraft process'ini başlatma
5. Process çıktısını (stdout/stderr) loglama
6. Process crash olursa hata yönetimi

Örnek JVM argümanları:
-Xmx2G -XX:+UseG1GC -Djava.library.path=<natives> -cp <classpath> net.minecraft.client.main.Main

TypeScript ile yaz.
```

---

## Prompt 6: React UI - Ana Ekran

```
Electron + React + TypeScript ile Minecraft Launcher UI'ı yapıyorum.

Ana ekranda şunlar olmalı:
1. Sol tarafta oynanabilir sürümlerin listesi (scrollable)
2. Seçili sürümün detayları (sürüm tipi, çıkış tarihi, boyut)
3. Büyük "OYNA" butonu
4. Sağ üstte kullanıcı profil bilgisi (skin, isim)
5. Alt kısımda indirme/başlatma ilerleme çubuğu

Modern, koyu tema, Minecraft tarzı bir tasarım olsun.
Tailwind CSS kullan. Komponentleri ayrı dosyalara böl.
```

---

## Prompt 7: Electron Ana Yapılandırma

```
Electron + React + TypeScript projesi için ana yapılandırma dosyalarını oluştur:

1. package.json (electron-forge veya electron-builder ile)
2. tsconfig.json (main ve renderer için ayrı)
3. webpack/vite yapılandırması (renderer için)
4. electron ana giriş dosyası (main.ts)
5. preload script (güvenli IPC için contextBridge)

electron-builder ile Windows için .exe paketleme yapılandırması da ekle.
```

---

## Prompt 8: Hata Yönetimi ve Logging

```
Minecraft Launcher için kapsamlı hata yönetimi ve logging sistemi kur:

1. Winston veya electron-log ile dosya bazlı logging
2. Network hataları için retry mekanizması (exponential backoff)
3. Kullanıcıya gösterilecek hata mesajları (Türkçe)
4. Crash raporu toplama
5. Offline mod desteği
```

---

## Kullanım Talimatı

Bu prompt'ları sırayla (1'den 8'e kadar) Gemini'ye gönder.
Her prompt'tan aldığın kodu projene ekle ve bir sonraki adıma geç.

Önerilen geliştirme sırası:
1. Önce Prompt 7 (proje iskeleti)
2. Sonra Prompt 1 (mimari plan)
3. Prompt 2 (auth)
4. Prompt 3 (sürüm yönetimi)
5. Prompt 4 (Java yönetimi)
6. Prompt 5 (oyun başlatma)
7. Prompt 6 (UI)
8. Prompt 8 (hata yönetimi ve logging)

---

## Prompt 9: Mod Yönetimi (Forge, Fabric, Quilt)

```
Minecraft Launcher'ıma mod desteği eklemek istiyorum.

Şunları yapabilmeli:
1. Forge, Fabric ve Quilt mod loader'larını otomatik indirip kurma
2. Mods klasörüne .jar dosyalarını yönetme
3. Modları listeleme, etkinleştirme/devre dışı bırakma
4. Mod versiyon uyumluluğunu kontrol etme
5. CurseForge ve Modrinth API'leri ile mod arama/indirme
6. Mod çakışmalarını tespit etme

TypeScript ile yaz. Mod indirme için CurseForge API (https://api.curseforge.com) 
ve Modrinth API (https://api.modrinth.com/v2) kullan.
```

---

## Prompt 10: Skin ve Karakter Yönetimi

```
Minecraft Launcher'ıma skin yönetimi eklemek istiyorum:

1. Kullanıcının mevcut skin'ini gösterme (3D preview)
2. Skin değiştirme (dosyadan yükleme veya URL'den)
3. Skin'i Minecraft/Mojang API'ye yükleme
4. Skin kütüphanesi (popüler skin'leri listeleme)
5. Cape (pelerin) yönetimi
6. Skin oluşturucu (basit bir pixel art editor)

Skin preview için three.js kullanarak 3D model renderla.
Mojang skin API: https://api.mojang.com/users/profiles/minecraft/<username>
Skin URL: https://crafatar.com/renders/body/<uuid>
```

---

## Prompt 11: Ayarlar ve Konfigürasyon

```
Minecraft Launcher için kapsamlı bir ayarlar sayfası yap:

1. Genel Ayarlar:
   - Varsayılan oyun dizini seçimi
   - RAM ayarı (kaydırıcı ile, 512MB - 32GB)
   - Java executable path seçimi
   - Özel JVM argümanları girişi
   - Pencere boyutu (fullscreen, özel çözünürlük)
   - Dil seçimi (TR, EN, DE, FR, ES, vb.)

2. Görünüm Ayarları:
   - Tema seçimi (koyu, açık, sistem)
   - Arka plan değiştirme
   - Animasyonları aç/kapat

3. İndirme Ayarları:
   - Maksimum paralel indirme sayısı
   - İndirme hız limiti
   - İndirme konumu

4. Gelişmiş Ayarlar:
   - Log seviyesi
   - Beta sürümleri göster
   - Snapshot'ları göster
   - Eski sürümleri göster

React + TypeScript ile yaz. Ayarları electron-store veya JSON dosyasına kaydet.
```

---

## Prompt 12: Sunucu Yönetimi ve Multiplayer

```
Minecraft Launcher'a sunucu yönetimi ekle:

1. Sunucu listesi (ekleme, silme, düzenleme)
2. Sunucu durumunu kontrol etme (ping, oyuncu sayısı, MOTD)
3. Direkt bağlanma (sunucuya hızlı bağlan)
4. Favori sunucular
5. Son bağlanılan sunucular geçmişi
6. Sunucu ikonlarını gösterme

Sunucu ping için Minecraft Server List Ping protokolünü kullan.
TypeScript + Node.js ile yaz.
```

---

## Prompt 13: Resource Pack ve Shader Yönetimi

```
Minecraft Launcher'ıma resource pack ve shader yönetimi ekle:

1. Yüklü resource pack'leri listeleme
2. Resource pack sıralamasını değiştirme (drag & drop)
3. Resource pack etkinleştirme/devre dışı bırakma
4. Yeni pack indirme (CurseForge/Modrinth API'den)
5. Pack detaylarını gösterme (çözünürlük, format, açıklama)
6. Shader pack'leri için aynı işlemler
7. Uyumluluk kontrolü (pack formatı vs Minecraft sürümü)

React ile sürükle-bırak arayüzü yap.
```

---

## Prompt 14: Launcher Otomatik Güncelleme

```
Minecraft Launcher'ın kendisini otomatik güncellemesi için bir sistem kur:

1. GitHub Releases'ten son sürümü kontrol etme
2. Yeni sürüm varsa kullanıcıya bildirme
3. Otomatik indirme ve kurulum
4. Güncelleme changelog'unu gösterme
5. Eski sürüme geri dönebilme
6. Güncelleme ilerleme çubuğu

electron-updater paketini kullan. TypeScript ile yaz.
```

---

## Prompt 15: Haberler ve İçerik Akışı

```
Minecraft Launcher ana ekranına haber ve içerik akışı ekle:

1. Minecraft.net'ten resmi haberleri çekme
2. Minecraft YouTube kanalından son videolar
3. Popüler mod/modpack önerileri
4. Topluluk spotlight'ları
5. Yaklaşan Minecraft etkinlikleri

Haberler için RSS feed veya web scraping kullan.
React ile kart tabanlı bir haber akışı tasarımı yap.
```

---

## Prompt 16: Performans Optimizasyonu

```
Minecraft Launcher performansı için optimizasyon yap:

1. Oyun başlatma süresini optimize etme:
   - Asset indexing (zaten inmiş asset'leri tekrar indirmeme)
   - Library caching
   - Paralel indirme optimizasyonu

2. Bellek yönetimi:
   - Büyük dosya indirmelerinde streaming
   - Gereksiz verileri temizleme

3. UI performansı:
   - Sanal listeleme (react-window) - büyük listeler için
   - Lazy loading görseller
   - Debounce/throttle arama input'ları

4. Başlangıç süresini azaltma:
   - Lazy initialization
   - Electron ready-to-show optimizasyonu

TypeScript ile yaz. Her optimizasyonu ayrı ayrı açıkla.
```

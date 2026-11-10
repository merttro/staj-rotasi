# Kodu anlamak için kısa notlar

## React ne yapıyor

`staj-app.tsx`, seçili ekranı ve çalışma alanı verisini `useState` ile tutar. Durum değiştiğinde React ilgili arayüzü yeniden çizer. Ayrı HTML dosyaları arasında gitmek yerine aynı uygulama içinde dört görünüm arasında geçilir.

## LocalStorage ne yapıyor

İlk `useEffect`, tarayıcıdaki JSON kaydını okuyup doğrular. Kayıt yoksa örnek verileri yükler. İkinci `useEffect`, çalışma alanı değişince yeni JSON'u kaydeder. `ready` kontrolü, kayıt okunmadan boş ilk React durumunun eski verinin üstüne yazılmasını önler. Bozuk kayıtlar otomatik ezilmez.

## Veriler nasıl bağlanıyor

Her projenin `id` değeri vardır. Görevdeki `projectId`, görevin hangi projeye ait olduğunu gösterir. Notlar bir projeye bağlı olabilir veya genel not olarak tutulabilir. `removeProject` ilgili görev ve notları da kaldırır.

## Durum nasıl değişiyor

Görevdeki `status` alanı `todo`, `doing` veya `done` olabilir. Form ve seçim kutusu bu alanı değiştirir. Kartlar yeni değere göre ilgili panoya yerleşir. Aynı veriler ilerleme oranını ve özet sayılarını da besler.

## Yedek kontrolü neden var

Dosyanın JSON olarak okunabilmesi yeterli değildir. İçindeki veriler beklenen projeye ve sürüme ait olmalı, görevlerin projeleri mevcut olmalı ve alanlar geçerli olmalıdır. `validateWorkspace` bu kuralları uygular. Yedek yükleme mevcut alanı değiştirmeden önce ayrıca onay bekler.

## TypeScript ve test farkı

TypeScript, kod yazılırken yanlış tipleri yakalamaya yardımcı olur. Kullanıcının dosyasından gelen veri çalışma zamanında hâlâ bozuk olabilir; bu nedenle şema kontrolü de gerekir. Otomatik testler ise tarih, ilerleme ve kayıt ilişkileri gibi davranışları gerçek örneklerle sınar.

## Bir dakikalık proje anlatımı

Staj Rotası, staj projelerini, görevleri ve öğrenme notlarını bir yerde tutan bir React uygulamasıdır. Proje ekliyor, ona görev bağlıyor ve görevleri üç durum arasında taşıyorum. İlerleme oranı tamamlanan görevlerden hesaplanıyor. Veriler LocalStorage ile her ziyaretçinin kendi tarayıcısında tutuluyor. JSON yedeği indirip başka cihazda yükleyebiliyorum. Yapay zekayı uygulamanın planlanması, kodlanması, hata ayıklaması ve dokümantasyonu için kullandım. Hesap sistemi ve otomatik cihaz eşitleme bu sürümde yok.

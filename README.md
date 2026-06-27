# ⚡ BlitzPass — Monad Üzerinde Canlı Etkinlik Deneyimleri

Herhangi bir canlı etkinliği — bir **konser**, **e-spor finali**, **festival** veya **buluşma** (meetup) — gerçek zamanlı, zincir üstü (on-chain) bir tüketici deneyimine dönüştürün.

Bir QR kod taratın → cüzdanınız anında oluşturulsun (uygulama yüklemek yok, kelime dizisi (seed phrase) yok, **gas ücreti yok**) → **BlitzPass** biletinizi alın → **reaksiyonlarınızı** ateşleyin → ve dev ekranda tüm salonun canlanışını izleyin: canlı bir **aktivite akışı**, **en çok reaksiyon gönderenler tablosu** ve **her reaksiyonun gerçek zamanlı olarak ağa işlendiğini gösteren sayaçlar**.

Monad paralel-EVM test ağı üzerinde **Monad Blitz Ankara** için geliştirilmiştir.

---

## Neden bu bir *Monad* uygulaması? (Firebase değil)

Bilet alma (claim) ve gönderilen her reaksiyon **gerçek bir zincir üstü (on-chain) işlemdir (transaction)**. Sahne ekranında canlı bir **işlem + TPS (Saniyedeki İşlem) sayacı** bulunur — bu da bir veritabanını değil, doğrudan ağın kendisini izlediğinizin kanıtıdır. Bir salon dolusu insanın aynı anda telefonlarından reaksiyon göndermesi, tam olarak Monad'ın **paralel işlem yürütme, 400ms blok süreleri ve yüksek ağ kapasitesi (throughput)** özellikleri için biçilmiş kaftandır. Üstelik BlitzPass biletiniz ve reaksiyon geçmişiniz katılımcının kendi cüzdanında saklanır — etkinlikten sonra da sizinle kalan taşınabilir bir "orada bulunma kanıtı" (proof-of-presence).

Buna ek olarak BlitzPass, BlitzMarket ile ortak bir **on-chain ekonomiyi (`BlitzCoin`)** paylaşır. Kullanıcılar etkinliklerde ödül kazanır ve bu coin'leri anında markette harcayabilir.

## Nasıl Çalışır?

| Parça | Teknoloji |
|------|------|
| Akıllı sözleşme (`BlitzPass` & `BlitzCoin`) | Solidity + Hardhat, Monad test ağına deploy edilmiştir (chain `10143`) |
| Gas Ücretsiz Katılım (Gasless) | Tarayıcıda çalışan **geçici cüzdan (burner wallet)** (viem) + gas ücretlerini karşılayan backend **relayer havuzu** |
| Telefon uygulaması | Next.js (App Router) + viem — katıl, biletini al, reaksiyon ver, ödül kazan |
| Sahne ekranı | Tamamen zincir üstü olaylardan beslenen canlı akış + liderlik tablosu + katılımcı / tx / TPS sayaçları |

## Repo Yapısı

```
contracts/   Hardhat projesi — BlitzCoin.sol, testler ve deploy scripti
web/         Next.js uygulaması — etkinlik vitrini, telefon uygulaması, sahne ekranı ve relayer API
```

## Hızlı Başlangıç

```bash
# 1) contracts (Akıllı Sözleşmeler)
cd contracts
npm install
npm run keys                       # deployer + relayer cüzdan anahtarlarını üretir
# Ekranda yazan adresleri https://faucet.monad.xyz adresinden fonlayın, PRIVATE_KEY değerini contracts/.env dosyasına koyun
npm test                           # testleri çalıştırın
npm run deploy                     # Monad test ağına deploy eder -> shared/blitzcoin.json dosyasını yazar

# 2) web (Next.js Uygulaması)
cd ../web
npm install
# RELAYER_KEYS=0x..,0x.. değerlerini web/.env.local dosyasına ekleyin
npm run dev                        # http://localhost:3000
```

Monad testnet: RPC `https://testnet-rpc.monad.xyz` · chainId `10143` · faucet `https://faucet.monad.xyz`

> ⚠️ Hackathon kodudur. Cüzdanlar demo amaçlı geçicidir; özel anahtarları tekrar kullanmayın veya denetlenmemiş sözleşmeleri mainnet'e deploy etmeyin.

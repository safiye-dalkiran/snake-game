/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// DOM Elementleri
const currentScoreEl = document.getElementById("current-score");
const highScoreEl = document.getElementById("high-score");
const uiOverlay = document.getElementById("ui-overlay");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreEl = document.getElementById("final-score");

// MOBİL DOKUNMATİK DİNLEYİCİLERİ
const btnUp = document.getElementById("btn-up");
const btnDown = document.getElementById("btn-down");
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");

// 🔘 MENÜ BUTON TETİKLEYİCİLERİ
const btnStartGame = document.getElementById("btn-start-game");
const btnRestartGame = document.getElementById("btn-restart-game");
const btnHome = document.getElementById("btn-home"); // 👈 Yeni eklendi

// 🎨 RENK BUTONLARI DİNLEYİCİSİ
const renkButonlari = document.querySelectorAll(".color-dot");

// Meyve Görselleri
const elmaResmi = new Image();
elmaResmi.src = "image/elma.png";

const curukResmi = new Image();
curukResmi.src = "image/curuk.png";

const tabakResmi = new Image();
tabakResmi.src = "image/tabak.png";

const altinResmi = new Image();
altinResmi.src = "image/altin.png";

// Ses Efektleri
const yemSesi = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");

// Oyun Ayarları
const sutun = 20;
const satir = 20;
let gen, yuk;
let yilan = [];
let yon;
let skor;
let enYuksekSkor = localStorage.getItem("snake_high_score") || 0;
let timerId = null;
let curukTimerId = null; //  Çürük elmanın 6 saniyelik geri sayımı için
let aktifYemler = [];    //  Ekrandaki aktif meyvelerin havuzu
let yoneVerildi;
let oyunHizi;
let oyunBasladi = false;
let yilanRengi = "#388e3c"; // 🎨 Varsayılan yılan rengi (Klasik yeşil)

yemSesi.preload = "auto";
yemSesi.volume = 0.3;

// İlk kurulum puan ekranı için rekoru yazdır
highScoreEl.textContent = formatSkor(enYuksekSkor);

function oyunuHazirla() {
    sahneyiTemizle();
    skor = 0;
    oyunHizi = 220;
    yon = { x: 1, y: 0 };
    aktifYemler = []; // Yem listesini sıfırla
    if (curukTimerId) clearTimeout(curukTimerId); // Eski sayacı temizle

    yilanHazirla();
    yemleriHazirla();
    gen = canvas.width / sutun;
    yuk = canvas.height / satir;

    currentScoreEl.textContent = formatSkor(skor);
    yilaniCiz();
    yemleriCiz();
}

function oyunuBaslat() {
    oyunBasladi = true;
    uiOverlay.classList.add("hidden");

    // Oyun başladığı an iki ekranı da içeride gizliyoruz ki bir sonraki tura temiz başlasın
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    oyunuHazirla();
    oyunDongusu();
}

function oyunDongusu() {
    if (!oyunBasladi) return;

    hareket();
    if (oyunBasladi) {
        timerId = setTimeout(oyunDongusu, oyunHizi);
    }
}

function yilanHazirla() {
    yilan = [{ x: sutun / 2, y: satir / 2 }];
    yilan.push({ x: yilan[0].x - 1, y: yilan[0].y });
    yilan.push({ x: yilan[0].x - 2, y: yilan[0].y });
}

function yemleriHazirla() {
    if (curukTimerId) {
        clearTimeout(curukTimerId);
    }

    aktifYemler = [];
    let yemTaze;

    // 1. TAZE MEYVEYİ HAZIRLA
    do {
        let sans = Math.random();
        let tur = "normal";

        if (sans < 0.15) tur = "tabak";
        else if (sans < 0.25) tur = "altin";
        else tur = "normal";

        yemTaze = {
            x: rastgele(sutun),
            y: rastgele(satir),
            tur: tur
        };
    } while (yilan.some(b => b.x === yemTaze.x && b.y === yemTaze.y));

    aktifYemler.push(yemTaze);

    // 2. ÇÜRÜK ELMAYI HAZIRLA (%35 İHTİMAL)
    if (Math.random() < 0.35) {
        let yemCuruk;
        do {
            yemCuruk = {
                x: rastgele(sutun),
                y: rastgele(satir),
                tur: "curuk"
            };
        } while (
            yilan.some(b => b.x === yemCuruk.x && b.y === yemCuruk.y) ||
            (yemCuruk.x === yemTaze.x && yemCuruk.y === yemTaze.y)
        );

        aktifYemler.push(yemCuruk);

        //  6 saniye sonra çürük elmayı yok etme sayacı
        curukTimerId = setTimeout(function () {
            aktifYemler = aktifYemler.filter(yem => yem.tur !== "curuk");

            sahneyiTemizle();
            yilaniCiz();
            yemleriCiz();
        }, 6000);
    }
}

function rastgele(max) {
    return Math.floor(Math.random() * max);
}

function sesCal(sesElementi) {
    sesElementi.currentTime = 0;
    sesElementi.play().catch(error => {
        console.log("Ses çalma engellendi:", error);
    });
}

// 🎨 HEX Kodunu RGB formatına çeviren sihirbaz fonksiyonu
function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 76, g: 175, b: 80 };
}

function yilaniCiz() {
    let rgb = hexToRgb(yilanRengi);
    let azaltma = 0.5 / (yilan.length - 1);

    // 1. GÖVDE ÇİZİMİ (Renk bağımsız saydamlaşma efekti)
    for (let i = yilan.length - 1; i > 0; i--) {
        const bogum = yilan[i];

        let boyutOrani = 1 - (i / yilan.length) * 0.4;
        let mevcutGen = gen * boyutOrani;
        let mevcutYuk = yuk * boyutOrani;

        let offsetX = (gen - mevcutGen) / 2;
        let offsetY = (yuk - mevcutYuk) / 2;

        let x = bogum.x * gen + offsetX;
        let y = bogum.y * yuk + offsetY;

        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.8 - i * azaltma})`;

        ctx.beginPath();
        ctx.roundRect(x, y, mevcutGen, mevcutYuk, 8);
        ctx.fill();
    }

    // 2. KAFA ÇİZİMİ
    const kafa = yilan[0];
    const kafaX = kafa.x * gen;
    const kafaY = kafa.y * yuk;

    ctx.fillStyle = yilanRengi;
    ctx.beginPath();
    ctx.arc(kafaX + gen / 2, kafaY + yuk / 2, gen / 2, 0, Math.PI * 2);
    ctx.fill();

    // 3. GÖZLER
    const gozYaricap = gen * 0.08;
    ctx.fillStyle = "white";

    if (yon.x === 1) {
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.7, kafaY + yuk * 0.3, gozYaricap, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.7, kafaY + yuk * 0.7, gozYaricap, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.75, kafaY + yuk * 0.3, gozYaricap * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.75, kafaY + yuk * 0.7, gozYaricap * 0.5, 0, Math.PI * 2); ctx.fill();
    } else if (yon.x === -1) {
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.3, kafaY + yuk * 0.3, gozYaricap, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.3, kafaY + yuk * 0.7, gozYaricap, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.25, kafaY + yuk * 0.3, gozYaricap * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.25, kafaY + yuk * 0.7, gozYaricap * 0.5, 0, Math.PI * 2); ctx.fill();
    } else if (yon.y === -1) {
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.3, kafaY + yuk * 0.3, gozYaricap, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.6, kafaY + yuk * 0.3, gozYaricap, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.3, kafaY + yuk * 0.25, gozYaricap * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.6, kafaY + yuk * 0.25, gozYaricap * 0.5, 0, Math.PI * 2); ctx.fill();
    } else if (yon.y === 1) {
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.3, kafaY + yuk * 0.7, gozYaricap, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.6, kafaY + yuk * 0.7, gozYaricap, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.3, kafaY + yuk * 0.75, gozYaricap * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(kafaX + gen * 0.6, kafaY + yuk * 0.75, gozYaricap * 0.5, 0, Math.PI * 2); ctx.fill();
    }
}

function yemleriCiz() {
    const olcekOrani = 0.95;
    const meyveGen = gen * olcekOrani;
    const meyveYuk = yuk * olcekOrani;

    const offsetX = (gen - meyveGen) / 2;
    const offsetY = (yuk - meyveYuk) / 2;

    aktifYemler.forEach(yem => {
        let secilenResim;
        let geciciRenk = "#ff5252";

        if (yem.tur === "normal") { secilenResim = elmaResmi; geciciRenk = "#ff5252"; }
        else if (yem.tur === "curuk") { secilenResim = curukResmi; geciciRenk = "#5d6d7e"; }
        else if (yem.tur === "tabak") { secilenResim = tabakResmi; geciciRenk = "#9c27b0"; }
        else if (yem.tur === "altin") { secilenResim = altinResmi; geciciRenk = "#ffb300"; }

        if (!secilenResim || !secilenResim.complete) {
            ctx.fillStyle = geciciRenk;
            ctx.beginPath();
            ctx.arc(yem.x * gen + gen / 2, yem.y * yuk + yuk / 2, gen / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        const x = yem.x * gen + offsetX;
        const y = yem.y * yuk + offsetY;
        ctx.drawImage(secilenResim, x, y, meyveGen, meyveYuk);
    });
}

function hucreCiz(konum, renk) {
    ctx.fillStyle = renk;
    ctx.fillRect(konum.x * gen, konum.y * yuk, gen - 1, yuk - 1);
}

function formatSkor(sayi) {
    return String(sayi).padStart(3, '0');
}

function hareket() {
    let yeniBas = {
        x: yilan[0].x + yon.x,
        y: yilan[0].y + yon.y
    };

    if (yilanKendineCarptiMi(yeniBas) || yeniBas.x < 0 || yeniBas.y < 0 || yeniBas.x >= sutun || yeniBas.y >= satir) {
        oyunBitti();
        return;
    }

    let yenilenYemIndex = aktifYemler.findIndex(yem => yem.x === yeniBas.x && yem.y === yeniBas.y);

    if (yenilenYemIndex !== -1) {
        const yenilenYem = aktifYemler[yenilenYemIndex];

        if (yenilenYem.tur === "curuk") {
            skor -= 1;
            if (skor < 0) skor = 0;

            yilan.unshift(yeniBas);
            yilan.pop();
            yilan.pop(); // KISALTMA AKTİF

            if (yilan.length < 2) yilanHazirla();

            aktifYemler.splice(yenilenYemIndex, 1);

            if (curukTimerId) clearTimeout(curukTimerId);
        } 
        else {
            yilan.unshift(yeniBas);

            if (yenilenYem.tur === "normal") {
                skor += 1;
            } else if (yenilenYem.tur === "altin") {
                skor += 5;
            } else if (yenilenYem.tur === "tabak") {
                skor += 3;
            }

            yemleriHazirla();
        }

        currentScoreEl.textContent = formatSkor(skor);

        yemSesi.currentTime = 0;
        yemSesi.play().catch(e => console.log("Ses engellendi:", e));

        if (oyunHizi > 60) {
            oyunHizi -= 3;
        }
    } else {
        yilan.unshift(yeniBas);
        yilan.pop();
    }

    sahneyiTemizle();
    yilaniCiz();
    yemleriCiz();
    yoneVerildi = false;
}

function yilanKendineCarptiMi(yeniBas) {
    let yemeGeldiMi = aktifYemler.some(yem => yem.x === yeniBas.x && yem.y === yeniBas.y);
    if (yemeGeldiMi) {
        return yilan.some(b => b.x === yeniBas.x && b.y === yeniBas.y);
    }
    return yilan.slice(0, -1).some(b => b.x === yeniBas.x && b.y === yeniBas.y);
}

function sahneyiTemizle() {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function oyunBitti() {
    oyunBasladi = false;
    clearTimeout(timerId);
    if (curukTimerId) clearTimeout(curukTimerId);

    if (skor > enYuksekSkor) {
        enYuksekSkor = skor;
        localStorage.setItem("snake_high_score", enYuksekSkor);
        highScoreEl.textContent = formatSkor(enYuksekSkor);
    }

    finalScoreEl.textContent = skor;

    // Giriş ekranı kapalı kalıyor, sadece Oyun Bitti ekranı açılıyor (Sıkışma çözüldü!)
    startScreen.classList.add("hidden");
    gameOverScreen.classList.remove("hidden");
    uiOverlay.classList.remove("hidden");
}

function tusaBasildi(e) {
    if (!oyunBasladi && e.which === 32) {
        oyunuBaslat();
        return;
    }

    if (yoneVerildi || !oyunBasladi) return;

    let yeniYon;
    switch (e.which) {
        case 37: yeniYon = { x: -1, y: 0 }; break;
        case 38: yeniYon = { x: 0, y: -1 }; break;
        case 39: yeniYon = { x: 1, y: 0 }; break;
        case 40: yeniYon = { x: 0, y: 1 }; break;
        default: return;
    }

    if ((yeniYon.x && yon.x) || (yeniYon.y && yon.y)) return;

    yon = yeniYon;
    yoneVerildi = true;
}

document.body.onkeydown = tusaBasildi;

// İlk kurguyu ayağa kaldır
oyunuHazirla();

function yonDegistir(yeniYon) {
    if (!oyunBasladi) {
        oyunuBaslat();
        return;
    }
    if (yoneVerildi) return;
    if ((yeniYon.x && yon.x) || (yeniYon.y && yon.y)) return;

    yon = yeniYon;
    yoneVerildi = true;
}

// Buton tetikleyicileri
btnUp.addEventListener("click", () => yonDegistir({ x: 0, y: -1 }));
btnDown.addEventListener("click", () => yonDegistir({ x: 0, y: 1 }));
btnLeft.addEventListener("click", () => yonDegistir({ x: -1, y: 0 }));
btnRight.addEventListener("click", () => yonDegistir({ x: 1, y: 0 }));

btnStartGame.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!oyunBasladi) oyunuBaslat();
});

btnRestartGame.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!oyunBasladi) oyunuBaslat();
});

// 🏠 ANA MENÜ BUTON TETİKLEYİCİSİ
btnHome.addEventListener("click", (e) => {
    e.stopPropagation();
    gameOverScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
    oyunuHazirla(); // Arkadaki yılanı ilk pozisyona getirip temizler
});

// 🎨 RENK SEÇİM ALANININ ÇALIŞTIRILMASI
renkButonlari.forEach(buton => {
    buton.addEventListener("click", (e) => {
        e.stopPropagation(); // Tıklamanın arkadaki overlay'i tetiklemesini önler

        const aktifOlan = document.querySelector(".color-dot.active");
        if (aktifOlan) aktifOlan.classList.remove("active");

        buton.classList.add("active");

        // Rengi al ve yılanı Canvas'ta anlık güncelle
        yilanRengi = buton.getAttribute("data-color");
        sahneyiTemizle();
        yilaniCiz();
        yemleriCiz();
    });
});
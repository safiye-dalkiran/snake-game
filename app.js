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
//elma göseli
const elmaResmi = new Image();
elmaResmi.src = "https://cdn-icons-png.flaticon.com/512/415/415733.png";

// Oyun Ayarları
const sutun = 20;
const satir = 20;
let gen, yuk;
let yilan = [];
let yon;
let skor;
let enYuksekSkor = localStorage.getItem("snake_high_score") || 0;
let timerId = null;
let yoneVerildi;
let oyunHizi; // Dinamik hız değişkeni
let oyunBasladi = false;

// İlk kurulum puan ekranı için
highScoreEl.textContent = formatSkor(enYuksekSkor);

function oyunuHazirla() {
    sahneyiTemizle();
    skor = 0;
    oyunHizi = 150; // Başlangıç hızı
    yon = { x: 1, y: 0 };
    yilanHazirla();
    yemiHazirla();
    gen = canvas.width / sutun;
    yuk = canvas.height / satir;

    currentScoreEl.textContent = formatSkor(skor);
    yilaniCiz();
    yemiCiz();
}

function oyunuBaslat() {
    oyunBasladi = true;
    uiOverlay.classList.add("hidden");
    oyunuHazirla();
    // Oyun döngüsünü başlat
    oyunDongusu();
}

function oyunDongusu() {
    if (!oyunBasladi) return;

    hareket();
    // Eğer oyun bitmediyse, güncel hız ile bir sonraki adımı tetikle
    if (oyunBasladi) {
        timerId = setTimeout(oyunDongusu, oyunHizi);
    }
}

function yilanHazirla() {
    yilan = [{ x: sutun / 2, y: satir / 2 }];
    yilan.push({ x: yilan[0].x - 1, y: yilan[0].y });
    yilan.push({ x: yilan[0].x - 2, y: yilan[0].y });
}

function yemiHazirla() {
    do {
        yem = { x: rastgele(sutun), y: rastgele(satir) };
    } while (yilan.some(b => b.x === yem.x && b.y === yem.y));
}

function rastgele(max) {
    return Math.floor(Math.random() * max);
}

function yilaniCiz() {
    hucreCiz(yilan[0], "#4caf50"); // Baş kısmı
    let azaltma = 0.5 / (yilan.length - 1);

    for (let i = 1; i < yilan.length; i++) {
        const bogum = yilan[i];
        hucreCiz(bogum, `rgba(76, 175, 80, ${0.8 - i * azaltma})`);
    }
}

function yemiCiz() {
    // ctx.fillRect yerine drawImage kullanıyoruz
    // drawImage(resim, x_konumu, y_konumu, genişlik, yükseklik)
    ctx.drawImage(
        elmaResmi,
        yem.x * gen,
        yem.y * yuk,
        gen - 1,
        yuk - 1
    );
}

function hucreCiz(konum, renk) {
    ctx.fillStyle = renk;
    ctx.fillRect(konum.x * gen, konum.y * yuk, gen - 1, yuk - 1); // Hücreler arası hafif boşluk
}

function formatSkor(sayi) {
    return String(sayi).padStart(3, '0');
}

function hareket() {
    let yeniBas = {
        x: yilan[0].x + yon.x,
        y: yilan[0].y + yon.y
    };

    // Duvara veya kendine çarpma kontrolü
    if (yilanKendineCarptiMi(yeniBas) || yeniBas.x < 0 || yeniBas.y < 0 || yeniBas.x >= sutun || yeniBas.y >= satir) {
        oyunBitti();
        return;
    }

    yilan.unshift(yeniBas);

    if (yeniBas.x === yem.x && yeniBas.y === yem.y) {
        skor++;
        currentScoreEl.textContent = formatSkor(skor);

        // Hız Kontrolü: Her yem yendiğinde yılanı %2 hızlandır (Minimum 60ms hıza kadar)
        if (oyunHizi > 60) {
            oyunHizi -= 4;
        }

        yemiHazirla();
    } else {
        yilan.pop();
    }

    sahneyiTemizle();
    yilaniCiz();
    yemiCiz();
    yoneVerildi = false;
}

function yilanKendineCarptiMi(yeniBas) {
    return yilan.some(b => b.x === yeniBas.x && b.y === yeniBas.y);
}

function sahneyiTemizle() {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function oyunBitti() {
    oyunBasladi = false;
    clearTimeout(timerId);

    // En yüksek skor kontrolü ve LocalStorage kaydı
    if (skor > enYuksekSkor) {
        enYuksekSkor = skor;
        localStorage.setItem("snake_high_score", enYuksekSkor);
        highScoreEl.textContent = formatSkor(enYuksekSkor);
    }

    // Arayüzü güncelle
    finalScoreEl.textContent = skor;
    startScreen.classList.add("hidden");
    gameOverScreen.classList.remove("hidden");
    uiOverlay.classList.remove("hidden");
}

function tusaBasildi(e) {
    // Oyun başlamadıysa ve SPACE (32) tuşuna basıldıysa oyunu başlat
    if (!oyunBasladi && e.which === 32) {
        oyunuBaslat();
        return;
    }

    if (yoneVerildi || !oyunBasladi) return;

    let yeniYon;
    switch (e.which) {
        case 37: yeniYon = { x: -1, y: 0 }; break; // Sol
        case 38: yeniYon = { x: 0, y: -1 }; break; // Üst
        case 39: yeniYon = { x: 1, y: 0 }; break;  // Sağ
        case 40: yeniYon = { x: 0, y: 1 }; break;  // Alt
        default: return;
    }

    // Ters yöne dönme engeli
    if ((yeniYon.x && yon.x) || (yeniYon.y && yon.y)) return;

    yon = yeniYon;
    yoneVerildi = true;
}

document.body.onkeydown = tusaBasildi;
elmaResmi.onload = function () {
    sahneyiTemizle();
    yemiCiz();
};
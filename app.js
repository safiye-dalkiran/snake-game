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

//  MENÜ BUTON TETİKLEYİCİLERİ
const btnStartGame = document.getElementById("btn-start-game");
const btnRestartGame = document.getElementById("btn-restart-game");
const btnHome = document.getElementById("btn-home");

//  RENK BUTONLARI DİNLEYİCİSİ
const renkButonlari = document.querySelectorAll(".color-dot");

// Meyve Görselleri
const elmaResmi = new Image(); elmaResmi.src = "image/elma.png";
const curukResmi = new Image(); curukResmi.src = "image/curuk.png";
const tabakResmi = new Image(); tabakResmi.src = "image/tabak.png";
const altinResmi = new Image(); altinResmi.src = "image/altin.png";
const iksirResmi = new Image(); iksirResmi.src = "image/celery.png"; 
const patatesResmi = new Image(); patatesResmi.src = "image/patates.png"; 

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
let curukTimerId = null;
let iksirTimerId = null;
let patatesTimerId = null; // ⏳ Patatesin 5 saniyelik zaman sayacı
let aktifYemler = [];
let yoneVerildi;
let oyunHizi;
let oyunBasladi = false;
let yilanRengi = "#388e3c";

// 🌀 Portal Kapı Girişleri (Satırların tam ortasındaki 3 kare: 9, 10, 11)
const portalSatirlari = [9, 10, 11];

yemSesi.preload = "auto";
yemSesi.volume = 0.3;

// İlk kurulum puan ekranı için rekor
highScoreEl.textContent = formatSkor(enYuksekSkor);

function oyunuHazirla() {
    sahneyiTemizle();
    skor = 0;
    oyunHizi = 220;
    yon = { x: 1, y: 0 };
    aktifYemler = [];
    if (curukTimerId) clearTimeout(curukTimerId);
    if (iksirTimerId) clearTimeout(iksirTimerId);
    if (patatesTimerId) clearTimeout(patatesTimerId);

    yilanHazirla();
    gen = canvas.width / sutun;
    yuk = canvas.height / satir;
    yemleriHazirla();

    currentScoreEl.textContent = formatSkor(skor);
    yilaniCiz();
    yemleriCiz();
}

function oyunuBaslat() {
    oyunBasladi = true;
    uiOverlay.classList.add("hidden");
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
    if (curukTimerId) clearTimeout(curukTimerId);
    if (iksirTimerId) clearTimeout(iksirTimerId);

    // Havuzdaki patatesi koru, eski süresi dolan çürük ve kerevizleri uçur
    aktifYemler = aktifYemler.filter(yem => yem.tur === "normal" || yem.tur === "tabak" || yem.tur === "altin" || yem.tur === "patates");

    // Ekranda taze ana meyve yoksa baştan üret
    const anaMeyveVarMi = aktifYemler.some(yem => yem.tur === "normal" || yem.tur === "tabak" || yem.tur === "altin");
    if (!anaMeyveVarMi) {
        let yemTaze;
        do {
            let sans = Math.random();
            let tur = "normal";

            if (sans < 0.15) tur = "tabak";
            else if (sans < 0.25) tur = "altin";
            else tur = "normal";

            yemTaze = { x: rastgele(sutun), y: rastgele(satir), tur: tur };
        } while (yilan.some(b => b.x === yemTaze.x && b.y === yemTaze.y));

        aktifYemler.push(yemTaze);
    }

    const anaMeyve = aktifYemler.find(yem => yem.tur === "normal" || yem.tur === "tabak" || yem.tur === "altin");

    // 2. ÇÜRÜK ELMAYI HAZIRLA (%35 İHTİMAL)
    if (Math.random() < 0.35) {
        let yemCuruk;
        do {
            yemCuruk = { x: rastgele(sutun), y: rastgele(satir), tur: "curuk" };
        } while (
            yilan.some(b => b.x === yemCuruk.x && b.y === yemCuruk.y) ||
            (anaMeyve && yemCuruk.x === anaMeyve.x && yemCuruk.y === anaMeyve.y)
        );

        aktifYemler.push(yemCuruk);

        curukTimerId = setTimeout(function () {
            aktifYemler = aktifYemler.filter(yem => yem.tur !== "curuk");
            sahneyiTemizle(); yilaniCiz(); yemleriCiz();
        }, 6000);
    }

    // 🥦 3. KEREVİZ DİYET ETKİSİ (Skor > 45, %35 İhtimal)
    if (skor > 45 && Math.random() < 0.35) {
        let yemIksir;
        do {
            yemIksir = { x: rastgele(sutun), y: rastgele(satir), tur: "iksir" };
        } while (
            yilan.some(b => b.x === yemIksir.x && b.y === yemIksir.y) ||
            aktifYemler.some(yem => yem.x === yemIksir.x && yem.y === yemIksir.y)
        );

        aktifYemler.push(yemIksir);

        iksirTimerId = setTimeout(function () {
            aktifYemler = aktifYemler.filter(yem => yem.tur !== "iksir");
            sahneyiTemizle(); yilaniCiz(); yemleriCiz();
        }, 7000);
    }

    // 🍟 4. PATATES KIZARTMASI YAVAŞLATICI (Skor > 30, %15 İhtimal)
    if (skor > 50 && Math.random() < 0.15) {
        const patatesVarMi = aktifYemler.some(yem => yem.tur === "patates");
        if (!patatesVarMi) {
            let yemPatates;
            do {
                yemPatates = { x: rastgele(sutun), y: rastgele(satir), tur: "patates" };
            } while (
                yilan.some(b => b.x === yemPatates.x && b.y === yemPatates.y) ||
                aktifYemler.some(yem => yem.x === yemPatates.x && yem.y === yemPatates.y)
            );

            aktifYemler.push(yemPatates);

            // Yeni patates gelirken eski zamanlayıcıyı güvenle sıfırlıyoruz 
            if (patatesTimerId) clearTimeout(patatesTimerId);
            patatesTimerId = setTimeout(function () {
                aktifYemler = aktifYemler.filter(yem => yem.tur !== "patates");
                sahneyiTemizle(); yilaniCiz(); yemleriCiz();
            }, 5000);
        }
    }
}

function rastgele(max) {
    return Math.floor(Math.random() * max);
}

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

    const kafa = yilan[0];
    const kafaX = kafa.x * gen;
    const kafaY = kafa.y * yuk;

    ctx.fillStyle = yilanRengi;
    ctx.beginPath();
    ctx.arc(kafaX + gen / 2, kafaY + yuk / 2, gen / 2, 0, Math.PI * 2);
    ctx.fill();

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
        else if (yem.tur === "iksir") { secilenResim = iksirResmi; geciciRenk = "#00bcd4"; }
        else if (yem.tur === "patates") { secilenResim = patatesResmi; geciciRenk = "#ffeb3b"; } // 🍟 Patates Sarısı

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

function portallariCiz() {
    ctx.strokeStyle = "#00bcd4";
    ctx.lineWidth = 5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00bcd4";

    portalSatirlari.forEach(sira => {
        ctx.beginPath();
        ctx.moveTo(0, sira * yuk);
        ctx.lineTo(0, (sira + 1) * yuk);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(canvas.width, sira * yuk);
        ctx.lineTo(canvas.width, (sira + 1) * yuk);
        ctx.stroke();
    });
    ctx.shadowBlur = 0;
}

function formatSkor(sayi) {
    return String(sayi).padStart(3, '0');
}

function hareket() {
    let yeniBas = {
        x: yilan[0].x + yon.x,
        y: yilan[0].y + yon.y
    };

    if (yeniBas.y < 0 || yeniBas.y >= satir) {
        oyunBitti();
        return;
    }

    // Portal kapısı geçiş mekanizması
    if (yeniBas.x >= sutun) {
        if (portalSatirlari.includes(yeniBas.y)) {
            yeniBas.x = 0;
        } else {
            oyunBitti();
            return;
        }
    } else if (yeniBas.x < 0) {
        if (portalSatirlari.includes(yeniBas.y)) {
            yeniBas.x = sutun - 1;
        } else {
            oyunBitti();
            return;
        }
    }

    if (yilanKendineCarptiMi(yeniBas)) {
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
            yilan.pop();

            if (yilan.length < 2) yilanHazirla();
            aktifYemler.splice(yenilenYemIndex, 1);
            if (curukTimerId) clearTimeout(curukTimerId);
        }
        else if (yenilenYem.tur === "iksir") {
            yilan.unshift(yeniBas);

            let yeniBoyut = Math.floor(yilan.length * (2 / 3));
            if (yeniBoyut < 3) yeniBoyut = 3;

            yilan.splice(yeniBoyut);
            aktifYemler.splice(yenilenYemIndex, 1);
            if (iksirTimerId) clearTimeout(iksirTimerId);
            yemleriHazirla();
        }
        else if (yenilenYem.tur === "patates") {
            // Patates kızartması o anki hızı %50 yavaşlatır
            yilan.unshift(yeniBas);

            // Mevcut hızı %50 oranında artırarak yavaşlatıyoruz
            oyunHizi = Math.floor(oyunHizi * 1.5);

            // Oyun hızının başlangıç hızından (220) daha yavaş olmamasını garanti ediyoruz
            if (oyunHizi > 220) {
                oyunHizi = 220;
            }

            aktifYemler.splice(yenilenYemIndex, 1);
            if (patatesTimerId) clearTimeout(patatesTimerId);
            yemleriHazirla();
        }
        else {
            yilan.unshift(yeniBas);
            if (yenilenYem.tur === "normal") skor += 1;
            else if (yenilenYem.tur === "altin") skor += 5;
            else if (yenilenYem.tur === "tabak") skor += 3;

            // Diğer taze yemler yenince patatesi havuzdan güvenle izole ediyoruz 
            aktifYemler = aktifYemler.filter(yem => yem.tur === "patates");
            yemleriHazirla();
        }

        currentScoreEl.textContent = formatSkor(skor);
        yemSesi.currentTime = 0;
        yemSesi.play().catch(e => console.log(e));

        // Patates yenmediği sürece her normal yemde yılan hızlanmaya devam eder
        if (yenilenYem.tur !== "patates" && oyunHizi > 60) {
            oyunHizi -= 3;
        }
    } else {
        yilan.unshift(yeniBas);
        yilan.pop();
    }

    sahneyiTemizle();
    yilaniCiz();
    yemleriCiz();
    portallariCiz();
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
    if (iksirTimerId) clearTimeout(iksirTimerId);
    if (patatesTimerId) clearTimeout(patatesTimerId);

    if (skor > enYuksekSkor) {
        enYuksekSkor = skor;
        localStorage.setItem("snake_high_score", enYuksekSkor);
        highScoreEl.textContent = formatSkor(enYuksekSkor);
    }

    finalScoreEl.textContent = skor;
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

btnHome.addEventListener("click", (e) => {
    e.stopPropagation();
    gameOverScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
    oyunuHazirla();
});

renkButonlari.forEach(buton => {
    buton.addEventListener("click", (e) => {
        e.stopPropagation();

        const aktifOlan = document.querySelector(".color-dot.active");
        if (aktifOlan) aktifOlan.classList.remove("active");

        buton.classList.add("active");

        yilanRengi = buton.getAttribute("data-color");
        sahneyiTemizle();
        yilaniCiz();
        yemleriCiz();
        portallariCiz();
    });
});
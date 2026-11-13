import '@fontsource-variable/manrope';
import '@fontsource/noto-naskh-arabic/arabic-400.css';
import '@fontsource/noto-naskh-arabic/arabic-700.css';

export const metadata = {
  title: 'Stech | Attendance Portal',
  description: 'Stech attendance and learning portal.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/madrasa-logo.png',
    apple: '/madrasa-logo.png'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Stech'
  }
};

const css = `
:root{--navy:#101b45;--navy-2:#1d2b5b;--purple:#c9a6e8;--purple-soft:#f3eafa;--maroon:#a71924;--gold:#d4af37;--ink:#17213e;--muted:#75809a;--line:#e7eaf1;--paper:#fff;--wash:#f6f7fb;--green:#218264;--red:#b6434e;--shadow:0 20px 55px #101b4510}
*{box-sizing:border-box}
html{min-height:100%;background:var(--wash);scroll-behavior:smooth}
body{margin:0;color:var(--ink);font-family:"Manrope",system-ui,sans-serif;font-optical-sizing:auto;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;background:radial-gradient(ellipse at 87% 1%,#c9a6e82b,transparent 28rem),radial-gradient(ellipse at 1% 79%,#d4af3718,transparent 25rem),linear-gradient(145deg,#fafbff 0%,#f4f6fb 54%,#fbf8fc 100%);min-height:100vh}
body:before{content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;opacity:.24;background-image:linear-gradient(#101b4506 1px,transparent 1px),linear-gradient(90deg,#101b4506 1px,transparent 1px);background-size:38px 38px;mask-image:linear-gradient(to bottom,black,transparent 80%)}
button,input,select{font:inherit}
button{cursor:pointer}
button:disabled{cursor:not-allowed;opacity:.5}
button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #c9a6e8b3;outline-offset:2px}
a{color:inherit;text-decoration:none}
.app-shell{max-width:1520px;margin:0 auto;padding:24px 36px 0;min-height:100vh;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:12px;min-width:0}
.brand img{width:53px;height:53px;object-fit:contain;flex:0 0 auto}
.brand-name{font-family:"Noto Naskh Arabic",serif;font-weight:700;font-size:17px;line-height:1.35;color:var(--navy)}
.brand-sub{display:block;color:var(--muted);font:700 9px/1.5 "Manrope",system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin-top:3px}
.top-nav{height:74px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;border:1px solid #ffffffd9;border-radius:20px;background:linear-gradient(110deg,#ffffffdb,#ffffff9c);backdrop-filter:blur(18px);box-shadow:0 8px 26px #101b4508,0 1px 0 #fff inset}
.nav-right{display:flex;align-items:center;gap:12px}
.secure-label{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:8px}
.secure-dot{height:8px;width:8px;border-radius:50%;background:#48a583;box-shadow:0 0 0 4px #48a58320}
.login-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(360px,.9fr);gap:clamp(35px,8vw,120px);align-items:center;flex:1;padding:52px 7% 66px;position:relative}
.welcome-panel{position:relative;padding:10px 0;animation:rise .7s ease both}
.welcome-panel:before{content:"";position:absolute;inset:-45px auto auto -52px;width:210px;height:210px;opacity:.16;pointer-events:none;background:repeating-conic-gradient(from 0deg,#c9a6e8 0 1deg,transparent 1deg 15deg);mask:radial-gradient(circle,transparent 0 34%,#000 35% 36%,transparent 37% 49%,#000 50% 51%,transparent 52%)}
.welcome-logo{width:min(270px,56vw);height:auto;object-fit:contain;display:block;margin:0 0 25px;filter:drop-shadow(0 13px 15px #101b4511)}
.eyebrow{display:inline-flex;align-items:center;gap:9px;color:var(--maroon);font-size:11px;letter-spacing:.19em;text-transform:uppercase;font-weight:800}
.eyebrow:before{content:"";width:25px;height:1px;background:var(--gold)}
.welcome-panel h1{font-size:clamp(36px,4.7vw,62px);letter-spacing:-.055em;line-height:1.03;color:var(--navy);margin:18px 0 15px;max-width:650px}
.welcome-panel p{max-width:490px;color:#68738e;font-size:16px;line-height:1.8;margin:0}
.welcome-quote{margin-top:26px;padding:15px 19px;border:1px solid #e8dfef;border-left:3px solid var(--gold);border-radius:0 14px 14px 0;background:linear-gradient(115deg,#ffffffcf,#f5effaaf);color:var(--navy);width:min(100%,440px);box-shadow:0 10px 24px #101b4508}
.quran-verse{font:500 23px/1.8 "Noto Naskh Arabic",serif;direction:rtl;color:var(--navy);text-align:right}
.verse-translation{font-size:12px;line-height:1.65;color:#64708a;margin-top:4px}
.verse-reference{font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#91701c;margin-top:9px}
.verse-controls{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
.verse-dots{display:flex;align-items:center;gap:6px}
.verse-dot{width:24px;height:24px;padding:0;border:0;border-radius:20px;background:transparent;display:grid;place-items:center}
.verse-dot:after{content:"";width:6px;height:6px;border-radius:20px;background:#d7d1df;transition:all .2s}
.verse-dot.active:after{width:16px;background:var(--gold)}
.verse-next{min-height:32px;border:0;background:transparent;color:var(--navy);font-size:10px;font-weight:800;padding:6px 0}
.login-card{position:relative;overflow:hidden;padding:38px;border:1px solid #ffffffed;border-radius:25px;background:linear-gradient(150deg,#ffffffed,#ffffffc9);box-shadow:0 28px 75px #101b4517,0 1px 0 #fff inset;backdrop-filter:blur(20px);animation:rise .7s .08s ease both;transition:box-shadow .3s,transform .3s}
.login-card:hover{box-shadow:0 32px 85px #101b451d,0 1px 0 #fff inset;transform:translateY(-2px)}
.login-card:after{content:"";position:absolute;right:-74px;top:-84px;width:185px;height:185px;border-radius:50%;border:1px solid #c9a6e84d;box-shadow:0 0 0 17px #c9a6e813,0 0 0 34px #c9a6e80b;pointer-events:none}
.login-card h2{color:var(--navy);font-size:25px;letter-spacing:-.03em;margin:0 0 7px;position:relative;z-index:1}
.login-card .intro{color:var(--muted);font-size:13px;margin:0 0 26px;position:relative;z-index:1}
.role-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:5px;border-radius:13px;background:#f1f2f7;margin-bottom:22px;position:relative;z-index:1}
.role-option{border:0;border-radius:9px;padding:11px 6px;background:transparent;color:#727b91;font-size:12px;font-weight:700;transition:all .2s}
.role-option.active{color:var(--navy);background:#fff;box-shadow:0 3px 12px #101b4510,inset 0 -2px var(--gold)}
.field{display:block;margin:0 0 16px}
.field-label{display:block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#58637e;margin:0 0 8px}
.field-control{width:100%;height:48px;border:1px solid #e1e4ec;border-radius:10px;padding:0 14px;background:#fff;color:var(--ink);outline:none;transition:border-color .2s,box-shadow .2s}
.field-control:focus{border-color:#a17bbd;box-shadow:0 0 0 3px #c9a6e82e}
.password-wrap{position:relative}
.password-wrap .field-control{padding-right:72px}
.show-password{position:absolute;right:9px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#7a638e;font-size:11px;font-weight:800;padding:7px}
.primary-button,.secondary-button,.danger-button{border:0;border-radius:10px;padding:12px 17px;font-weight:750;transition:transform .18s,box-shadow .18s,background .18s}
.primary-button{background:var(--navy);color:#fff;box-shadow:0 8px 16px #101b4524}
.primary-button:hover:not(:disabled){background:#1b2b61;transform:translateY(-1px);box-shadow:0 11px 19px #101b4528}
.login-submit{width:100%;margin-top:6px;min-height:49px}
.install-app-area{margin-top:12px}
.install-button{width:100%;min-height:45px;display:flex;align-items:center;justify-content:center;gap:9px;border:1px solid #e6e1ed;border-radius:10px;background:#fff;color:var(--navy);font-size:12px;font-weight:800;transition:background .18s,border-color .18s,transform .18s}
.install-button:hover:not(:disabled){background:#f8f5fb;border-color:#c9a6e8;transform:translateY(-1px)}
.install-button:disabled{color:var(--green);background:#f0f8f4;border-color:#cfeadd;opacity:1;cursor:default}
.install-button svg{width:17px;height:17px}
.install-message{margin:8px 0 0;color:#58637e;font-size:11px;line-height:1.55;text-align:center}
.install-error{color:#85620c}
.secondary-button{color:var(--navy);background:#f1eff7}
.secondary-button:hover:not(:disabled){background:#e8e1f1}
.danger-button{background:#fff0f0;color:var(--maroon);padding:8px 11px}
.danger-button:hover{background:#ffe5e5}
.message{border-radius:10px;padding:11px 13px;margin:0 0 16px;font-size:13px;line-height:1.5}
.message.error{background:#fff0f0;color:#9b2835;border:1px solid #f4d0d3}
.message.warning{background:linear-gradient(120deg,#fff8e6,#fffdf6);color:#745813;border:1px solid #ead8a3}
.message.success{background:#edf8f3;color:#216b52;border:1px solid #cfeadd}
.portal-layout{display:grid;grid-template-columns:235px minmax(0,1fr);gap:27px;align-items:start;padding:28px 0 35px;flex:1}
.sidebar{position:sticky;top:22px;border-radius:19px;border:1px solid #fff;background:#ffffffbe;padding:17px 12px;box-shadow:0 12px 34px #101b4508;backdrop-filter:blur(12px)}
.sidebar .brand{padding:4px 8px 18px;border-bottom:1px solid var(--line);margin-bottom:15px}
.sidebar .brand img{width:44px;height:44px}
.sidebar .brand-name{font-size:15px}
.side-label{font-size:9px;letter-spacing:.17em;text-transform:uppercase;color:#a1a8b8;font-weight:800;padding:3px 11px 8px}
.side-nav{display:grid;gap:5px}
.nav-item{border:0;text-align:left;background:transparent;color:#69748c;border-radius:10px;padding:11px 12px;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:650;transition:all .18s}
.nav-item:hover{background:#f4f1f9;color:var(--navy)}
.nav-item.active{color:var(--navy);background:linear-gradient(100deg,#eee7f6,#f7f4fa);box-shadow:inset 3px 0 var(--purple)}
.nav-icon{width:18px;height:18px;display:grid;place-items:center;font-size:15px}
.nav-icon svg{width:17px;height:17px;display:block}
.sidebar-foot{margin:22px 5px 1px;border-radius:12px;padding:13px;background:#f8f6fb;color:#65708a;font-size:11px;line-height:1.6}
.sidebar-foot strong{display:block;color:var(--navy);font-size:12px;margin-bottom:2px}
.dashboard-main{min-width:0}
.dashboard-top{display:flex;justify-content:space-between;align-items:center;gap:15px;margin:1px 0 24px}
.dashboard-heading h1{color:var(--navy);font-size:27px;letter-spacing:-.04em;margin:0 0 5px}
.dashboard-heading p{margin:0;color:var(--muted);font-size:13px}
.profile-pill{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line);border-radius:13px;padding:9px 12px;min-width:0}
.avatar{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:var(--purple-soft);color:var(--navy);font-weight:800;font-size:13px}
.profile-name{font-size:12px;font-weight:800;color:var(--navy);white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis}
.profile-role{display:block;color:var(--muted);font-size:10px;margin-top:2px}
.logout-button{border:0;background:transparent;color:var(--maroon);font-size:11px;font-weight:800;padding:8px}
.mobile-tabs{display:none}
.hero-banner{position:relative;overflow:hidden;min-height:175px;border:1px solid #415080;border-radius:20px;padding:27px 30px;margin-bottom:14px;background:radial-gradient(ellipse at 86% 12%,#c9a6e838,transparent 34%),linear-gradient(110deg,#101b45,#263568 68%,#303e75);color:#fff;box-shadow:0 18px 40px #101b4525,inset 0 1px 0 #ffffff17}
.hero-banner:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.2;background-image:linear-gradient(#ffffff13 1px,transparent 1px),linear-gradient(90deg,#ffffff13 1px,transparent 1px);background-size:28px 28px;mask-image:linear-gradient(90deg,transparent 22%,black)}
.hero-banner:after{content:"";position:absolute;right:6%;top:-84px;width:250px;height:250px;border:1px solid #ffffff24;border-radius:50%;box-shadow:0 0 0 19px #ffffff08,0 0 0 39px #ffffff06}
.hero-banner h2{position:relative;z-index:1;font-size:24px;letter-spacing:-.03em;margin:0 0 9px;max-width:560px}
.hero-banner p{position:relative;z-index:1;font-size:13px;line-height:1.7;color:#d4d9e8;margin:0;max-width:530px}
.banner-mark{position:absolute;right:29px;bottom:-24px;width:150px;height:150px;object-fit:contain;opacity:.92}
.content-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.content-grid>.message{grid-column:1/-1}
.card{background:linear-gradient(145deg,#ffffffed,#ffffffc7);border:1px solid #ffffffed;border-radius:17px;padding:21px;box-shadow:var(--shadow),0 1px 0 #fff inset;backdrop-filter:blur(16px);min-width:0;animation:rise .35s ease both;transition:transform .24s,box-shadow .24s}
.card:hover{box-shadow:0 24px 60px #101b4517,0 1px 0 #fff inset}
.card.full{grid-column:1/-1}
.card-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 17px}
.card-heading h2,.card-heading h3{margin:0;color:var(--navy);font-size:16px;letter-spacing:-.02em}
.card-heading p{margin:4px 0 0;color:var(--muted);font-size:11px}
.stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}
.stat-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;box-shadow:0 8px 20px #101b4507}
.stat-label{color:var(--muted);font-size:11px;font-weight:700}
.stat-value{display:block;color:var(--navy);font-size:26px;font-weight:800;letter-spacing:-.04em;margin:8px 0 2px}
.stat-note{color:#929aab;font-size:10px}
.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px;align-items:end}
.form-grid .wide{grid-column:1/-1}
.form-actions{display:flex;align-items:center;gap:10px;padding:0 0 16px}
.form-actions .primary-button{min-width:120px}
.inline-form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) auto;gap:9px;align-items:end}
.inline-form .field{margin-bottom:0}
.field input[type="date"]{color-scheme:light}
.table-wrap{width:100%;overflow:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;border:1px solid var(--line);border-radius:12px;background:#fff}
table{width:100%;border-collapse:collapse;min-width:500px;font-size:12px}
th{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#818ba0;background:#f8f9fc;font-weight:800}
th,td{text-align:left;padding:12px 14px;border-bottom:1px solid #edf0f5;white-space:nowrap}
tr:last-child td{border-bottom:0}
tbody tr:hover td{background:#fcfbfe}
.status-badge{display:inline-flex;align-items:center;border-radius:99px;padding:5px 9px;font-size:10px;font-weight:800}
.status-P{background:#eaf7f0;color:#257c5f}.status-A{background:#fff0ef;color:#a73a43}.status-L{background:#fff7e2;color:#8b6a14}
.mark-actions{display:flex;gap:6px}
.mark-button{min-width:34px;padding:6px 9px;border:1px solid var(--line);border-radius:8px;color:#718096;background:#fff;font-size:11px;font-weight:800}
.mark-button.selected-P{color:#1c785a;background:#eaf7f0;border-color:#b9e2cd}
.mark-button.selected-A{color:#a53640;background:#fff0ef;border-color:#f1c8cc}
.mark-button.selected-L{color:#85620c;background:#fff7e2;border-color:#ebd99a}
.table-empty{text-align:center!important;padding:25px!important;color:#9098a8}
.toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:15px}
.toolbar .field{margin:0;min-width:150px}
.toolbar .field-control{height:42px}
.toolbar .field-control.compact{width:160px}
.message-input{height:132px;padding:12px 14px;resize:vertical;line-height:1.55}
.message-form-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--muted);font-size:11px}
.message-date-group+.message-date-group{margin-top:20px}
.message-date-group>h3{margin:0 0 10px;color:#8b6a14;font-size:11px;letter-spacing:.1em;text-transform:uppercase}
.announcement-list{display:grid;gap:11px}
.announcement-card{min-width:0;padding:16px;border:1px solid var(--line);border-radius:13px;background:linear-gradient(145deg,#fff,#fbfaff);box-shadow:0 8px 24px #101b4508}
.announcement-topline,.announcement-footer{display:flex;align-items:center;justify-content:space-between;gap:10px}
.announcement-topline time,.announcement-footer{color:var(--muted);font-size:10px}
.announcement-audience{border-radius:20px;padding:5px 9px;background:#f3eafa;color:#654879;font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
.announcement-audience.audience-teachers{background:#fff3e7;color:#915b19}
.announcement-card h4{margin:12px 0 5px;color:var(--navy);font-size:15px;overflow-wrap:anywhere}
.announcement-content{margin:0 0 14px;color:#59647e;font-size:13px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}
.announcement-footer{border-top:1px solid #edf0f5;padding-top:10px}
.announcement-footer .danger-button{padding:7px 10px}
.holiday-callout{padding:12px 14px;border-radius:10px;background:#fff7e2;color:#775d16;font-size:12px;margin:12px 0 15px}
.attendance-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-top:16px}
.attendance-footer span{font-size:11px;color:var(--muted)}
.progress-track{height:8px;border-radius:99px;background:#eef0f5;overflow:hidden;margin-top:8px}
.progress-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--purple),var(--navy));transition:width .5s ease}
.arabic{font-family:"Noto Naskh Arabic",serif}
.dashboard-verse{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:12px 17px;margin:0 0 19px;border:1px solid #e9e4ef;border-radius:13px;background:linear-gradient(110deg,#ffffffd9,#f4eff9c9);box-shadow:0 7px 20px #101b4508}
.dashboard-verse .quran-verse{font-size:19px;line-height:1.7}
.dashboard-verse .verse-translation{margin-top:1px;font-size:11px}
.dashboard-verse .verse-reference{margin-top:4px;font-size:8px}
.dashboard-verse .verse-controls{justify-content:flex-end;min-width:86px}
.dashboard-verse .verse-next{font-size:10px}
.app-footer{margin-top:auto;min-height:75px;border-top:1px solid #e5e8ef;display:flex;align-items:center;justify-content:space-between;gap:15px;padding:13px 4px;color:#8a93a5;font-size:11px}
.app-footer .brand img{width:35px;height:35px}
.app-footer .brand-name{font-size:12px}
.app-footer .brand-sub{font-size:8px}
.loading{min-height:60vh;display:grid;place-items:center;color:var(--muted);font-size:13px}
.spinner{width:24px;height:24px;border:2px solid #e4d8ee;border-top-color:var(--navy);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 10px}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:980px){.app-shell{padding:16px 21px 0}.login-layout{gap:45px;padding:45px 2%}.portal-layout{grid-template-columns:190px minmax(0,1fr);gap:18px}.stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.inline-form{grid-template-columns:repeat(2,minmax(0,1fr))}.inline-form button{height:44px}}
@media(max-width:820px){.login-layout{grid-template-columns:minmax(0,1fr);gap:27px;max-width:570px;margin:auto;padding:36px 10px 45px}.welcome-panel{text-align:center}.welcome-logo{width:166px;margin:0 auto 17px}.welcome-panel h1{font-size:clamp(36px,6vw,48px);margin:14px auto 10px}.welcome-panel p{font-size:14px;margin:auto}.welcome-quote{font-size:17px;margin:15px auto 0}.welcome-panel:before{left:7%;top:-22px;width:145px;height:145px}}
@media(max-width:700px){.app-shell{padding:11px 12px 0}.top-nav{height:64px;border-radius:15px;padding:0 13px}.brand img{width:44px;height:44px}.brand-name{font-size:14px}.brand-sub{font-size:8px}.secure-label{font-size:0}.secure-dot{margin-right:4px}.login-layout{grid-template-columns:1fr;gap:22px;padding:22px 0 30px;max-width:480px;margin:auto}.welcome-panel{text-align:center}.welcome-logo{width:130px;margin:0 auto 14px}.welcome-panel h1{font-size:35px;margin:11px auto 9px}.welcome-panel p{font-size:12px;line-height:1.65;margin:auto}.welcome-quote{margin:12px auto 0;padding:12px 14px;border-radius:12px}.quran-verse{font-size:21px;line-height:1.75}.verse-translation{font-size:11px}.verse-controls{gap:7px}.verse-next{font-size:9px}.welcome-panel:before{left:10%;top:-15px;width:110px;height:110px}.login-card{padding:23px 18px;border-radius:19px}.login-card h2{font-size:22px}.portal-layout{display:block;padding:18px 0 25px}.sidebar{display:none}.dashboard-top{align-items:flex-start;margin:5px 1px 16px}.dashboard-heading h1{font-size:22px}.dashboard-heading p{font-size:11px}.profile-pill{padding:6px 8px;gap:7px}.avatar{height:32px;width:32px}.profile-name{max-width:88px;font-size:10px}.logout-button{font-size:10px;padding:6px}.mobile-tabs{display:flex;overflow:auto;gap:6px;margin:0 -1px 15px;padding:1px 1px 5px;scrollbar-width:none}.mobile-tabs::-webkit-scrollbar{display:none}.mobile-tabs .nav-item{white-space:nowrap;flex:0 0 auto;background:#fff;border:1px solid var(--line);padding:9px 11px;font-size:11px}.mobile-tabs .nav-item.active{background:var(--navy);color:#fff;border-color:var(--navy);box-shadow:none}.hero-banner{min-height:140px;padding:20px 17px;border-radius:16px}.hero-banner h2{font-size:19px;max-width:77%}.hero-banner p{font-size:10px;max-width:75%}.banner-mark{right:1px;width:100px;height:100px}.dashboard-verse{align-items:stretch;flex-direction:column;gap:5px;padding:12px 14px;margin-bottom:14px}.dashboard-verse .quran-verse{font-size:18px;text-align:right}.dashboard-verse .verse-controls{justify-content:space-between;min-width:0;margin-top:3px}.content-grid{grid-template-columns:1fr;gap:11px}.card{padding:16px;border-radius:14px}.card.full{grid-column:auto}.stat-grid{gap:8px;margin-bottom:12px}.stat-card{padding:13px;border-radius:12px}.stat-value{font-size:22px}.stat-label{font-size:10px}.inline-form{grid-template-columns:1fr 1fr}.form-grid{gap:0 8px}.table-wrap{margin:0 -1px;width:calc(100% + 2px)}.app-footer{min-height:65px;font-size:9px}.app-footer .brand{gap:7px}.app-footer .brand img{width:29px;height:29px}}
@media(max-width:390px){.login-card{padding:22px 16px}.role-option{font-size:10px}.profile-pill{gap:5px}.avatar{display:none}.profile-name{max-width:78px}.hero-banner p{max-width:76%}.banner-mark{width:90px;height:90px}.inline-form{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.dashboard-top{gap:6px}.dashboard-heading p{max-width:145px}.profile-pill{padding:5px 6px}.dashboard-verse .verse-controls{gap:3px}.verse-next{font-size:8px}}
@media(max-width:340px){.app-shell{padding-left:9px;padding-right:9px}.top-nav{padding:0 9px}.brand{gap:7px}.brand img{width:38px;height:38px}.brand-name{font-size:12px}.role-picker{gap:3px}.role-option{padding:10px 3px}.hero-banner h2{font-size:17px}.dashboard-heading h1{font-size:19px}.attendance-footer{align-items:flex-start;flex-direction:column}.attendance-footer .primary-button{width:100%}.app-footer{align-items:flex-start;flex-direction:column;padding:10px 0}.app-footer>span{padding-left:5px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;

export default function RootLayout({ children }) {
  return <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta name="theme-color" content="#101B45" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </head>
    <body>{children}</body>
  </html>;
}

// public/js/app.js
// SkillEx - Campus Freelancing & Peer Collaboration Platform Full-Stack Client

const $ = s => document.querySelector(s);
const dlg = $('#dlg');

// State
let role = 'guest';
let theme = localStorage.getItem('skillex_theme') || '';
let currentUser = null; // Manual login required!
let loginPortal = 'student'; // 'student' or 'admin'
let filt = { q: '', cat: 'All', max: 20000, avail: false };
let tab = { w: 'Overview' };
let cachedProjects = [];
let cachedFreelancers = [];
let cachedNotifications = [];
let cachedWorkspace = null;

// Design Constants
const COL = ['#F2A65A', '#7BC8A4', '#8FA8F5', '#F28FB0', '#C9A7F0', '#6EC6E8'];

const av = (n = 'U', i = 0) => {
  const initials = n.split(' ').map(w => w[0]).join('').slice(0, 2);
  return `<span class="av" style="background:${COL[Math.abs(i) % COL.length]}">${initials}</span>`;
};

const ST = ['Draft', 'Open', 'Applications', 'Assigned', 'In Progress', 'Submitted', 'Revision Requested', 'Resubmitted', 'Approved', 'Completed'];
const stepper = c => `<div class="step">${ST.map((s, i) => `<span class="${i < c ? 'done' : i === c ? 'cur' : ''}">${s}</span>`).join('')}</div>`;
const bd = (t, k = 'pri') => `<span class="b ${k}">${t}</span>`;
const ver = `<span class="ver" title="Verified by DYPATU college email">✔ Verified Student</span>`;

const pcard = p => `
  <a href="#/project/${p.id}" class="card pc" style="--c:${COL[(parseInt(p.id.replace(/\D/g, '')) || 1) % 6]};display:block;color:inherit">
    <div class="row between">
      <span class="tag">${p.category || p.cat}</span>
      <span class="match">${p.matchPercent || p.m || 92}%<span class="mut"> match</span></span>
    </div>
    <h3 style="margin-top:8px">${p.title || p.t}</h3>
    <div class="row">${(p.skills || p.sk || []).map(s => `<span class="tag">${s}</span>`).join('')}</div>
    <div class="row between" style="margin-top:10px">
      <b>₹${(p.budget || p.v || 3000).toLocaleString('en-IN')}</b>
      <span class="mut">Due ${p.deadline || p.d} · ${(p.proposalsCount !== undefined ? p.proposalsCount : p.n) || 0} proposals · ${p.complexity || p.cx || 'Medium'}</span>
    </div>
    <div class="mut" style="margin-top:6px">${p.clientName || p.c || 'Student Client'} ${ver}</div>
  </a>
`;

const fcard = f => `
  <div class="card">
    <div class="row between">
      <div class="row">${av(f.name || f.n, (parseInt(f.id.replace(/\D/g, '')) || 1))}<div><b>${f.name || f.n}</b><div class="mut">${f.department || f.dep}</div></div></div>
      <span class="match">${f.matchPercent || f.m || 90}%</span>
    </div>
    <ul class="mut" style="padding-left:18px;margin:10px 0">${(f.whyPoints || f.why || ['Verified portfolio', 'On-time delivery']).map(w => `<li>${w}</li>`).join('')}</ul>
    <div class="row between">
      <span class="mut">★ ${(f.stats ? f.stats.reputation : f.r) || 4.8} · ${(f.stats ? f.stats.onTimeRate : f.ot) || 95}% on time</span>
      <a class="btn s" href="#/profile">View profile</a>
    </div>
  </div>
`;

const stat = (l, v, s = '') => `<div class="card"><div class="mut">${l}</div><div style="font:800 28px 'Bricolage Grotesque'">${v}</div><div class="mut">${s}</div></div>`;

function bars(d, h = 140) {
  const m = Math.max(...d.map(x => x[1]), 1);
  return `<svg viewBox="0 0 ${d.length * 52} ${h + 24}" width="100%" role="img" aria-label="bar chart">${d.map((x, i) => {
    const bh = (x[1] / m) * h;
    return `<rect x="${i * 52 + 8}" y="${h - bh}" width="36" height="${bh}" rx="6" fill="${x[2] || 'var(--pri)'}"/><text x="${i * 52 + 26}" y="${h + 16}" text-anchor="middle" font-size="11" fill="var(--mut)">${x[0]}</text><text x="${i * 52 + 26}" y="${h - bh - 4}" text-anchor="middle" font-size="11" fill="var(--ink)">${x[1]}</text>`;
  }).join('')}</svg>`;
}

function line(a, b) {
  const W = 420, H = 120, m = Math.max(...a, ...b, 1);
  const pt = d => d.map((v, i) => `${(i * W) / (d.length - 1)},${H - (v / m) * H}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H + 8}" width="100%" role="img" aria-label="trend"><polyline points="${pt(a)}" fill="none" stroke="var(--pri)" stroke-width="3"/><polyline points="${pt(b)}" fill="none" stroke="var(--ok)" stroke-width="3" stroke-dasharray="6 4"/></svg><div class="mut"><b style="color:var(--pri)">—</b> Projects posted &nbsp;<b style="color:var(--ok)">- -</b> Active students</div>`;
}

const rep = (o = {}) => `
  <div class="card">
    <h3>SkillEx Reputation</h3>
    <div class="row">
      <div style="font:800 40px 'Bricolage Grotesque'">4.8</div>
      <div>${bd('Campus Trusted', 'ok')}<div class="mut">23 projects · 6 repeat clients</div></div>
    </div>
    ${[
      ['Quality', 96],
      ['Communication', 92],
      ['Timeliness', 94],
      ['Requirement adherence', 90]
    ].map(x => `<div class="row between mut" style="margin-top:8px"><span>${x[0]}</span><b>${x[1]}%</b></div><div class="bar"><i style="width:${x[1]}%"></i></div>`).join('')}
    <p class="mut" style="margin-top:10px">On-time rate 94% · Repeat clients 26%</p>
  </div>
`;

const toast = m => {
  const t = $('#toast');
  if (!t) return;
  t.textContent = m;
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2500);
};

const ask = (t, p, f) => {
  $('#dt').textContent = t;
  $('#dp').textContent = p;
  $('#dok').onclick = () => {
    dlg.close();
    f();
  };
  dlg.showModal();
};

const NAV = {
  student: [
    ['dash', '▦', 'Dashboard'],
    ['discover', '⌕', 'Discover projects'],
    ['post', '＋', 'Post project'],
    ['workspace', '▣', 'Workspace'],
    ['messages', '✉', 'Messages'],
    ['profile', '☺', 'My profile'],
    ['projects', '▤', 'My projects'],
    ['proposals', '⇄', 'My proposals'],
    ['reviews', '★', 'Reputation'],
    ['notifications', '🔔', 'Notifications'],
    ['settings', '⚙', 'Settings']
  ],
  admin: [
    ['admin', '▦', 'Overview'],
    ['admin-verify', '✔', 'Verification queue'],
    ['admin-skills', '◔', 'Skill demand & supply'],
    ['admin-users', '☰', 'Users'],
    ['admin-mod', '◈', 'Moderation'],
    ['admin-reports', '⚑', 'Reports & disputes'],
    ['admin-logs', '≡', 'Audit logs']
  ]
};

const tbl = (h, r) => `<div class="card" style="overflow:auto"><table><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr>${r}</table></div>`;

// Views Object
const V = {
  landing: () => {
    const ch = ['React', 'Figma', 'Python', 'Video editing', 'Flutter', 'Illustrator', 'Excel', 'Technical writing', 'Photography', 'Pandas', 'UI/UX', 'Arduino', 'Public speaking', 'Firebase']
      .map(x => `<span class="tag" style="font-size:14px;padding:5px 14px">${x}</span>`)
      .join('');

    const recentProjects = (cachedProjects.length ? cachedProjects.slice(0, 3) : [
      { id: 'p1', title: 'Fest website for TechNova 2026', category: 'Web Dev', budget: 6000, deadline: 'Nov 18', proposalsCount: 7, clientName: 'Riya Deshmukh', skills: ['React', 'Figma', 'Tailwind'], complexity: 'Medium', matchPercent: 94 },
      { id: 'p5', title: 'Data cleaning for survey of 600 students', category: 'Data', budget: 1800, deadline: 'Oct 30', proposalsCount: 5, clientName: 'Omkar Shinde', skills: ['Python', 'Pandas'], complexity: 'Low', matchPercent: 88 },
      { id: 'p2', title: 'Logo and brand kit for Robotics Club', category: 'Design', budget: 2500, deadline: 'Oct 28', proposalsCount: 12, clientName: 'Karan Jadhav', skills: ['Illustrator', 'Branding'], complexity: 'Low', matchPercent: 81 }
    ]);

    return `
      <div class="lh">
        <div>
          <span class="tag">✔ Closed campus · verified DYPATU students only</span>
          <h1 style="margin-top:14px">Your Campus. <span class="hl">Your Skills.</span> Your Opportunities.</h1>
          <p class="mut" style="font-size:18px;max-width:520px">Hire the batchmate who built the fest website. Earn from the skills you already use in labs. Everyone here is a real student with a verified college email.</p>
          <div class="row" style="margin:20px 0">
            <a class="btn p" style="padding:12px 22px;font-size:16px" href="#/auth/register">Join with college email</a>
            <a class="btn" style="padding:12px 22px;font-size:16px" href="#/discover">Browse projects</a>
          </div>
          <div class="row">
            ${av('Aditi Kamble', 3)}
            <span style="margin-left:-18px">${av('Rohan Gaikwad', 1)}</span>
            <span style="margin-left:-18px">${av('Meera Joshi', 2)}</span>
            <span class="mut"><b style="color:var(--ink)">2,418 students</b> have joined this semester</span>
          </div>
        </div>
        <div class="stk">
          <div class="fc" style="top:14px;left:2%;width:80%;transform:rotate(-2.5deg)">
            <i class="pin"></i>
            <div class="row between"><span class="tag">Web Dev</span><span class="match">94%<span class="mut"> match</span></span></div>
            <h3 style="margin-top:8px">Fest website for TechNova 2026</h3>
            <div class="row"><span class="tag">React</span><span class="tag">Figma</span><span class="tag">Tailwind</span></div>
            <div class="row between" style="margin:10px 0 6px"><b>₹6,000</b><span class="mut">Due Nov 18 · 7 proposals</span></div>
            <div class="bar"><i style="width:55%"></i></div>
          </div>
          <div class="fc" style="top:190px;right:0;width:66%;transform:rotate(2.5deg)">
            <i class="pin" style="background:var(--pri)"></i>
            <div class="row">${av('Aditi Kamble', 3)}<div><b>Aditi Kamble</b><div class="ver">✔ Verified Student</div></div></div>
            <div class="match" style="margin:8px 0 2px">92% Match</div>
            <div class="mut">5/6 skills · 96% on time · Free before deadline</div>
          </div>
          <div class="fc" style="bottom:0;left:0;width:56%;transform:rotate(-1.5deg)">
            <div class="row between"><b>Milestone approved</b>${bd('Done', 'ok')}</div>
            <div class="mut">Homepage + schedule</div>
            <div style="font:800 22px 'Bricolage Grotesque';margin-top:4px">₹1,500 released</div>
          </div>
        </div>
      </div>
      <div class="mq" aria-label="Skills students offer"><div>${ch}${ch}</div></div>
      <div class="sec"><h2>One campus. Three ways to use it.</h2><p class="mut">The same student can hire on Monday and get hired on Friday.</p></div>
      <div class="grid g3">${[
        ['Earn as a freelancer', 'Show your skills and portfolio. Apply to projects from people you actually know.', 'var(--pri)'],
        ['Hire as a client', 'Post a project, compare proposals with clear match reasons, and pick the person you trust.', '#F2A65A'],
        ['Build proof of work', 'Every finished project adds reviews, on-time rate and repeat clients to your profile.', '#7BC8A4']
      ].map(c => `<div class="card top" style="--c:${c[2]}"><h3>${c[0]}</h3><p class="mut">${c[1]}</p></div>`).join('')}</div>
      <div class="sec"><h2>From idea to delivered in four steps</h2></div>
      <div class="grid g4">${[
        ['Verify', 'Sign up with your college email and confirm the OTP.'],
        ['Post or apply', 'Describe the work, or send a proposal to a project you like.'],
        ['Work together', 'Use the shared workspace for milestones, files and chat.'],
        ['Review', 'Both sides rate each other after the work is approved.']
      ].map((x, i) => `<div class="card"><div class="num">${i + 1}</div><h3 style="margin-top:10px">${x[0]}</h3><p class="mut">${x[1]}</p></div>`).join('')}</div>
      <div class="sec row between"><div><h2>On the noticeboard today</h2><p class="mut">Fresh projects from your campus</p></div><a class="btn" href="#/discover">See all projects</a></div>
      <div class="grid g3">${recentProjects.map(pcard).join('')}</div>
      <div class="sec"><h2>Built so people can trust each other</h2></div>
      <div class="grid g2">${[
        ['✔', 'Verified students only', 'Every account is tied to a college email and checked by admins.'],
        ['🔒', 'Private project files', 'Only the client and the selected freelancer can open them.'],
        ['⚑', 'Report and dispute', 'One tap to flag a problem. Moderators review chat and files.'],
        ['◎', 'Match scores that explain themselves', 'You see why someone fits. You always make the final call.']
      ].map(t => `<div class="card row" style="flex-wrap:nowrap;align-items:flex-start"><span class="av" style="background:var(--soft);color:var(--pri)">${t[0]}</span><div><h3>${t[1]}</h3><p class="mut">${t[2]}</p></div></div>`).join('')}</div>
      <div class="grid g2" style="margin-top:14px">${[
        ['A client from my own batch left me a review, and a recruiter noticed it in my internship interview.', 'Rohan Gaikwad', 'IT, 2nd year'],
        ['Posting took five minutes. The analyzer reminded me to mention hosting, which I had forgotten.', 'Riya Deshmukh', 'Fest coordinator']
      ].map((q, i) => `<div class="card"><p style="font-size:17px">“${q[0]}”</p><div class="row">${av(q[1], i + 1)}<div><b>${q[1]}</b><div class="mut">${q[2]}</div></div></div></div>`).join('')}</div>
      <div class="band"><h2 style="font-size:30px">Your batchmates are already hiring.</h2><p style="opacity:.85">Join with your college email. It takes two minutes.</p><div class="row" style="justify-content:center;margin-top:14px"><a class="btn w" style="padding:12px 22px" href="#/auth/register">Create my account</a><a class="btn o" style="padding:12px 22px" href="#/auth/login">I already have one</a></div></div>
      <p class="mut" style="text-align:center;margin:26px 0 6px">SkillEx · Made for campuses, by students</p>
    `;
  },

  auth: (m = 'login') => {

    /* ---------- BRAND LEFT PANELS ---------- */
    const studentBrand = `
      <div class="auth-brand">
        <div class="auth-brand-logo">Skill<i>Ex</i></div>
        <div class="auth-brand-tagline">Your Campus.<br>Your Skills.<br>Your Opportunities.</div>
        <p class="auth-brand-sub">The closed campus freelancing network where verified college students hire each other, build portfolios, and earn real money.</p>
        <div class="auth-features">
          <div class="auth-feat"><span class="auth-feat-icon">✔</span> Verified students only — college email required</div>
          <div class="auth-feat"><span class="auth-feat-icon">🤝</span> AI-powered skill matching for every project</div>
          <div class="auth-feat"><span class="auth-feat-icon">🔒</span> Private workspace with milestone escrow</div>
          <div class="auth-feat"><span class="auth-feat-icon">⭐</span> Build verifiable reputation & proof of work</div>
        </div>
        <div class="auth-stats">
          <div class="auth-stat"><div class="auth-stat-num">2,418</div><div class="auth-stat-label">Students joined</div></div>
          <div class="auth-stat"><div class="auth-stat-num">612</div><div class="auth-stat-label">Projects done</div></div>
          <div class="auth-stat"><div class="auth-stat-num">94%</div><div class="auth-stat-label">On-time rate</div></div>
        </div>
        <div class="auth-trusted">
          <span class="auth-trusted-avatars">${av('Aditi K', 3)}${av('Rohan G', 1)}${av('Meera J', 2)}${av('Karan J', 5)}</span>
          <span>Trusted by students across campus</span>
        </div>
        <div class="auth-dots">${'<span></span>'.repeat(25)}</div>
      </div>
    `;

    const adminBrand = `
      <div class="auth-brand admin-brand">
        <div class="auth-brand-logo" style="color:#f8fafc">Skill<i>Ex</i></div>
        <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(59,130,246,0.2);color:#93c5fd;border:1px solid rgba(59,130,246,0.4);padding:5px 14px;border-radius:8px;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;position:relative;z-index:1">🛡️ Admin Console</span>
        <div class="auth-brand-tagline" style="font-size:24px">Campus Administration<br>& Moderation</div>
        <p class="auth-brand-sub">Monitor student verification, resolve disputes, manage platform trust & compliance, and view campus analytics.</p>
        <div class="auth-features">
          <div class="auth-feat"><span class="auth-feat-icon">📊</span> Real-time campus analytics dashboard</div>
          <div class="auth-feat"><span class="auth-feat-icon">🎓</span> Student KYC verification queue</div>
          <div class="auth-feat"><span class="auth-feat-icon">⚖️</span> Dispute resolution & audit trails</div>
          <div class="auth-feat"><span class="auth-feat-icon">🛡️</span> Content moderation & fraud detection</div>
        </div>
        <div class="auth-dots">${'<span></span>'.repeat(25)}</div>
      </div>
    `;

    const registerBrand = `
      <div class="auth-brand">
        <div class="auth-brand-logo">Skill<i>Ex</i></div>
        <div class="auth-brand-tagline">Join your campus<br>freelancing network</div>
        <p class="auth-brand-sub">Sign up takes 2 minutes. All you need is your college email. Start earning or hiring from day one.</p>
        <div class="auth-features">
          <div class="auth-feat"><span class="auth-feat-icon">1️⃣</span> Verify your college email address</div>
          <div class="auth-feat"><span class="auth-feat-icon">2️⃣</span> Set up your skills & department</div>
          <div class="auth-feat"><span class="auth-feat-icon">3️⃣</span> Start posting or applying to projects</div>
        </div>
        <div class="auth-stats">
          <div class="auth-stat"><div class="auth-stat-num">2min</div><div class="auth-stat-label">To sign up</div></div>
          <div class="auth-stat"><div class="auth-stat-num">Free</div><div class="auth-stat-label">For students</div></div>
          <div class="auth-stat"><div class="auth-stat-num">134</div><div class="auth-stat-label">Active projects</div></div>
        </div>
        <div class="auth-trusted">
          <span class="auth-trusted-avatars">${av('Aditi K', 3)}${av('Rohan G', 1)}${av('Meera J', 2)}</span>
          <span>Your batchmates are already here</span>
        </div>
        <div class="auth-dots">${'<span></span>'.repeat(25)}</div>
      </div>
    `;

    const otpBrand = `
      <div class="auth-brand">
        <div class="auth-brand-logo">Skill<i>Ex</i></div>
        <div class="auth-brand-tagline">Almost there!<br>Check your inbox</div>
        <p class="auth-brand-sub">We sent a 6-digit verification code to your college email. Enter it to verify your student identity.</p>
        <div class="auth-features">
          <div class="auth-feat"><span class="auth-feat-icon">📧</span> Code sent to your college email</div>
          <div class="auth-feat"><span class="auth-feat-icon">⏱️</span> Code expires in 10 minutes</div>
          <div class="auth-feat"><span class="auth-feat-icon">🔒</span> One-time use, auto-invalidated</div>
        </div>
        <div class="auth-dots">${'<span></span>'.repeat(25)}</div>
      </div>
    `;

    const onboardBrand = `
      <div class="auth-brand">
        <div class="auth-brand-logo">Skill<i>Ex</i></div>
        <div class="auth-brand-tagline">Let's set up<br>your profile</div>
        <p class="auth-brand-sub">Tell us about your skills and department so we can match you with the best projects and collaborators on campus.</p>
        <div class="auth-features">
          <div class="auth-feat"><span class="auth-feat-icon">🎯</span> Better matches with complete profiles</div>
          <div class="auth-feat"><span class="auth-feat-icon">📈</span> Skill-based project recommendations</div>
          <div class="auth-feat"><span class="auth-feat-icon">👁️</span> You control what's visible to others</div>
        </div>
        <div class="auth-dots">${'<span></span>'.repeat(25)}</div>
      </div>
    `;

    const forgotBrand = `
      <div class="auth-brand">
        <div class="auth-brand-logo">Skill<i>Ex</i></div>
        <div class="auth-brand-tagline">Reset your<br>password</div>
        <p class="auth-brand-sub">Enter your registered college email and we'll send you a link to create a new password.</p>
        <div class="auth-features">
          <div class="auth-feat"><span class="auth-feat-icon">📧</span> Check your college email for the link</div>
          <div class="auth-feat"><span class="auth-feat-icon">🔐</span> Create a strong new password</div>
          <div class="auth-feat"><span class="auth-feat-icon">✅</span> Sign back in instantly</div>
        </div>
        <div class="auth-dots">${'<span></span>'.repeat(25)}</div>
      </div>
    `;

    const brandMap = {
      login: loginPortal === 'admin' ? adminBrand : studentBrand,
      register: registerBrand,
      otp: otpBrand,
      forgot: forgotBrand,
      onboarding: onboardBrand
    };

    /* ---------- RIGHT FORM PANELS ---------- */
    const forms = {
      login: `
        <div class="auth-card">
          <div class="portal-switch">
            <button type="button" class="${loginPortal === 'student' ? 'active' : ''}" onclick="loginPortal='student';draw()">🎓 Student Portal</button>
            <button type="button" class="${loginPortal === 'admin' ? 'active' : ''}" onclick="loginPortal='admin';draw()">🛡️ Admin Portal</button>
          </div>

          <h2>${loginPortal === 'admin' ? '🛡️ Admin Console' : '👋 Welcome back'}</h2>
          <p class="auth-subtitle">${loginPortal === 'admin' ? 'Authorized campus administrators only' : 'Sign in to your campus account'}</p>

          ${loginPortal === 'admin' ? `
            <div class="auth-admin-banner">
              <span class="auth-admin-banner-icon">🛡️</span>
              <div>
                <b>Institutional Security Clearance</b>
                <p>Only authorized campus administrators and department coordinators may access this console.</p>
              </div>
            </div>
          ` : ''}

          <div class="auth-input-group">
            <label>${loginPortal === 'admin' ? 'Administrator Email' : 'College Email'}</label>
            <input id="login_email" placeholder="${loginPortal === 'admin' ? 'admin@dypatu.edu.in' : 'student@dypatu.edu.in'}" autocomplete="username">
          </div>

          <div class="auth-input-group">
            <label>${loginPortal === 'admin' ? 'Admin Password' : 'Password'}</label>
            <div class="auth-pass-wrap">
              <input id="login_pass" type="password" placeholder="Enter your password" autocomplete="current-password">
              <button type="button" class="auth-pass-toggle" onclick="togglePassVisibility('login_pass', this)" aria-label="Toggle password visibility">👁️</button>
            </div>
          </div>

          ${loginPortal === 'student' ? '<div style="text-align:right;margin:-8px 0 8px"><a href="#/auth/forgot" style="font-size:13px;font-weight:600">Forgot password?</a></div>' : ''}

          <button class="auth-btn ${loginPortal === 'admin' ? 'admin-btn' : ''}" onclick="doLogin('${loginPortal}')">
            ${loginPortal === 'admin' ? '🛡️ Access Admin Console' : '→ Sign In'}
          </button>

          ${loginPortal === 'student' ? `
            <div class="auth-demo-section">
              <p>🧪 Quick demo login</p>
              <div class="auth-demo-chips">
                <span class="demo-chip" onclick="document.getElementById('login_email').value='student@dypatu.edu.in';document.getElementById('login_pass').value='pass123';toast('Student credentials filled')">
                  ${av('Student', 0)} Student Demo
                </span>
              </div>
            </div>
          ` : `
            <div class="auth-demo-section">
              <p>🧪 Quick demo login</p>
              <div class="auth-demo-chips">
                <span class="demo-chip" onclick="document.getElementById('login_email').value='admin.ritu@dypatu.edu.in';document.getElementById('login_pass').value='admin123';toast('Admin credentials filled')">
                  🛡️ Ritu Sharma (Campus Admin)
                </span>
              </div>
            </div>
          `}

          <div class="auth-footer">
            ${loginPortal === 'student' ? 'New to SkillEx? <a href="#/auth/register">Create your account →</a>' : '<a href="#/auth/login" onclick="loginPortal=\'student\'">← Back to student login</a>'}
          </div>
        </div>
      `,

      register: `
        <div class="auth-card">
          <h2>🎓 Create your account</h2>
          <p class="auth-subtitle">Join the campus freelancing network in under 2 minutes</p>

          <div class="auth-input-group">
            <label>Full Name</label>
            <input id="reg_name" placeholder="Enter your full name" autocomplete="name">
          </div>

          <div class="auth-input-group">
            <label>College Email</label>
            <input id="reg_email" placeholder="student@dypatu.edu.in" autocomplete="email">
            <span style="display:block;margin-top:4px;font-size:12px;color:var(--mut)">🏫 Only your official college email domain is accepted</span>
          </div>

          <button class="auth-btn" onclick="doRegister()">Send Verification OTP →</button>

          <div class="auth-footer">
            Already have an account? <a href="#/auth/login">Sign in →</a>
          </div>
        </div>
      `,

      otp: `
        <div class="auth-card" style="text-align:center">
          <div style="font-size:48px;margin-bottom:8px">📧</div>
          <h2>Verify your email</h2>
          <p class="auth-subtitle">Enter the 6-digit code sent to <b style="color:var(--ink)">${pendingRegEmail || 'your email'}</b></p>

          <div class="auth-otp-row">
            <input class="auth-otp-digit" maxlength="1" inputmode="numeric" aria-label="Digit 1" oninput="authOtpMove(this, 1)" autofocus>
            <input class="auth-otp-digit" maxlength="1" inputmode="numeric" aria-label="Digit 2" oninput="authOtpMove(this, 2)">
            <input class="auth-otp-digit" maxlength="1" inputmode="numeric" aria-label="Digit 3" oninput="authOtpMove(this, 3)">
            <input class="auth-otp-digit" maxlength="1" inputmode="numeric" aria-label="Digit 4" oninput="authOtpMove(this, 4)">
            <input class="auth-otp-digit" maxlength="1" inputmode="numeric" aria-label="Digit 5" oninput="authOtpMove(this, 5)">
            <input class="auth-otp-digit" maxlength="1" inputmode="numeric" aria-label="Digit 6" oninput="authOtpMove(this, 6)">
          </div>
          <input type="hidden" id="otp_val">

          <div>
            <div class="otp-timer" id="otpTimerWrap">⏱️ Expires in: <span id="otpTimer">09:59</span></div>
          </div>

          <div style="margin: 14px 0 8px">
            <button type="button" class="demo-chip" onclick="autoFillDemoOtp('482913')" title="Click to fill test code">
              ⚡ Fill Demo Code (482913)
            </button>
          </div>

          <button class="auth-btn" id="verifyOtpBtn" onclick="collectOtpAndVerify()">✓ Verify & Continue</button>

          <p style="margin-top:14px;font-size:13px;color:var(--mut)">
            Didn't receive it? <a href="#" onclick="toast('New OTP sent to ' + (pendingRegEmail || 'email'));startOtpCountdown();return false" style="font-weight:600">Resend code</a>
          </p>

          <div class="auth-footer">
            <a href="#/auth/register">← Change email</a>
          </div>
        </div>
      `,

      forgot: `
        <div class="auth-card">
          <div style="font-size:40px;margin-bottom:4px">🔐</div>
          <h2>Reset password</h2>
          <p class="auth-subtitle">We'll send a password reset link to your registered college email</p>

          <div class="auth-input-group">
            <label>College Email</label>
            <input id="forgot_email" placeholder="student@dypatu.edu.in" autocomplete="email">
          </div>

          <button class="auth-btn" onclick="doForgotPassword()">Send Reset Link →</button>

          <div class="auth-footer">
            Remember your password? <a href="#/auth/login">Sign in →</a>
          </div>
        </div>
      `,

      onboarding: `
        <div class="auth-card">
          <h2>🎯 Complete your profile</h2>
          <p class="auth-subtitle">This helps us match you with the right projects and people</p>

          <div class="auth-input-group">
            <label>Department</label>
            <select id="onb_dept"><option>Computer Science & Engineering</option><option>IT</option><option>ENTC</option><option>Mechanical</option><option>Civil</option></select>
          </div>

          <div class="auth-input-group">
            <label>Year</label>
            <select id="onb_year"><option>1st year</option><option>2nd year</option><option>3rd year</option><option>4th year</option></select>
          </div>

          <label style="font-weight:700;font-size:13px;margin:14px 0 8px;display:block">I want to…</label>
          <label class="auth-checkbox">
            <input type="checkbox" checked style="width:auto"> 🛠️ Offer my skills as a freelancer
          </label>
          <label class="auth-checkbox">
            <input type="checkbox" checked style="width:auto"> 📋 Hire students for my projects
          </label>

          <div class="auth-input-group" style="margin-top:14px">
            <label>Top skills</label>
            <input id="onb_skills" placeholder="e.g. React, Python, UI/UX, Video Editing">
          </div>

          <div style="margin-bottom:14px">
            <p style="font-size:12px;color:var(--mut);margin:0 0 8px">Popular skills (click to add):</p>
            <div class="auth-skill-pills">
              ${['React', 'Figma', 'Python', 'Flutter', 'Video Editing', 'UI/UX', 'Node.js', 'Illustrator'].map(s =>
                `<span class="auth-skill-pill" onclick="addSkillToInput('${s}', this)">${s}</span>`
              ).join('')}
            </div>
          </div>

          <button class="auth-btn" onclick="doFinishOnboarding()">🚀 Finish Setup & Enter Campus</button>
        </div>
      `
    };

    return `
      <div class="auth-container">
        ${brandMap[m] || brandMap.login}
        <div class="auth-form-panel">
          <div class="auth-form-wrapper">
            ${forms[m] || forms.login}
          </div>
        </div>
      </div>
    `;
  },

  dash: () => {
    const p1 = cachedProjects.find(p => p.id === 'p5') || cachedProjects[0] || {};
    const p2 = cachedProjects.find(p => p.id === 'p1') || cachedProjects[1] || {};
    const freelancers = cachedFreelancers.length ? cachedFreelancers.slice(0, 2) : [];
    const userName = (currentUser && currentUser.name) ? currentUser.name : 'Student';
    const firstName = userName.split(' ')[0] || 'Student';
    const dept = (currentUser && (currentUser.department || currentUser.dept)) || 'CSE';
    const year = (currentUser && currentUser.year) || '2nd year';

    return `
      <div class="row between">
        <div class="row">
          ${av(userName, 2)}
          <div>
            <h2 style="margin:0">Hi ${firstName}, 3 things need you today</h2>
            <div class="mut">${dept} · ${year} ${ver}</div>
          </div>
        </div>
        <div class="row">
          <a class="btn p" href="#/post">Post project</a>
          <a class="btn" href="#/discover">Find work</a>
          <a class="btn" href="#/profile">Edit profile</a>
        </div>
      </div>
      <div class="grid g4" style="margin:16px 0">
        ${stat('Active projects', '3', '1 due this week')}
        ${stat('Pending proposals', '4', '2 shortlisted')}
        ${stat('Earned this term', '₹11,400')}
        ${stat('Reputation', '4.8 ★', '94% on time')}
      </div>
      <div class="two">
        <div>
          <h2>Recommended projects</h2>
          <div class="grid g2">${[p1, p2].filter(p => p.id).map(pcard).join('')}</div>
          <h2 style="margin-top:20px">Recommended freelancers</h2>
          <div class="grid g2">${freelancers.map(fcard).join('')}</div>
        </div>
        <div class="grid" style="align-content:start">
          <div class="card">
            <h3>Upcoming deadlines</h3>
            ${[
              ['Milestone 2 · Fest website', 'Oct 14'],
              ['Showreel first cut', 'Oct 22'],
              ['Survey data final', 'Oct 30']
            ].map(x => `<div class="row between"><span>${x[0]}</span>${bd(x[1], 'warn')}</div>`).join('<hr style="border:0;border-top:1px solid var(--line)">')}
          </div>
          <div class="card">
            <h3>Recent activity</h3>
            <div class="tl">
              <div>Aditi submitted Milestone 1<div class="mut">2h ago</div></div>
              <div>New proposal on “Fest website”<div class="mut">Yesterday</div></div>
              <div>Review received from Sneha ★5<div class="mut">2 days ago</div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  discover: () => {
    const list = cachedProjects.filter(p => {
      const matchCat = filt.cat === 'All' || p.category.toLowerCase() === filt.cat.toLowerCase();
      const matchBudget = p.budget <= filt.max;
      const matchQ = !filt.q || (
        p.title.toLowerCase().includes(filt.q.toLowerCase()) ||
        p.description.toLowerCase().includes(filt.q.toLowerCase()) ||
        (p.skills && p.skills.some(s => s.toLowerCase().includes(filt.q.toLowerCase())))
      );
      return matchCat && matchBudget && matchQ;
    });

    return `
      <h2>Discover projects</h2>
      <div class="two" style="grid-template-columns:230px 1fr">
        <div class="card" style="align-self:start">
          <label style="margin-top:0">Search</label>
          <input id="q" value="${filt.q}" placeholder="Skill or title" oninput="filt.q=this.value;draw(1)">
          <label>Category</label>
          <select onchange="filt.cat=this.value;draw()">
            ${['All', 'Web Dev', 'Design', 'App Dev', 'Video', 'Data', 'Writing'].map(c => `<option ${c === filt.cat ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
          <label>Max budget ₹${filt.max.toLocaleString('en-IN')}</label>
          <input type="range" min="1000" max="20000" step="500" value="${filt.max}" onchange="filt.max=+this.value;draw()">
          <label>Client rating</label>
          <select><option>Any</option><option>4★ and up</option></select>
          <label>Deadline</label>
          <select><option>Any time</option><option>This week</option></select>
          <label>Status</label>
          <select><option>Open</option></select>
          <label class="row"><input type="checkbox" style="width:auto"> Client verified only</label>
        </div>
        <div>
          ${list.length ? `
            <div class="grid g2">${list.map(pcard).join('')}</div>
          ` : `
            <div class="empty">
              <b>No projects match</b>
              <p>Try a wider budget or another category.</p>
              <button class="btn" onclick="filt={q:'',cat:'All',max:20000};draw()">Clear filters</button>
            </div>
          `}
        </div>
      </div>
    `;
  },

  project: id => {
    const p = cachedProjects.find(x => x.id === id || x.id === 'p' + id) || cachedProjects[0] || {};
    const isMine = p.clientId === currentUser.id || p.clientId === 'u1' || p.clientName === currentUser.name;
    const desc = p.description || 'Looking for a student with solid fundamentals who can deliver on time and keep me updated every two days.';
    const proposals = p._proposals || cachedFreelancers;

    return `
      <a href="#/discover" class="mut">← All projects</a>
      <div class="two" style="margin-top:8px">
        <div class="grid">
          <div class="card">
            <div class="row">
              <span class="tag">${p.category || 'Web Dev'}</span>
              ${bd(p.status || 'Open', 'ok')}
              ${bd((p.complexity || 'Medium') + ' complexity', 'mut')}
            </div>
            <h1 style="font-size:30px;margin-top:8px">${p.title}</h1>
            <p>${desc}</p>
            <h3>Deliverables</h3>
            <ul>${(p.deliverables || ['Working output', 'Source files', 'Short handover note']).map(x => `<li>${x}</li>`).join('')}</ul>
            <h3>Required skills</h3>
            <div class="row">${(p.skills || ['React', 'Figma']).map(s => `<span class="tag">${s}</span>`).join('')}</div>
          </div>
          <div class="card" style="border-color:var(--pri)">
            <h3>AI requirement insights ${bd('Suggestion', 'pri')}</h3>
            <ul class="mut">
              <li>Scope is clear. Estimated effort: ${p.complexity === 'High' ? '50–70 hours' : p.complexity === 'Low' ? '15–20 hours' : '35–45 hours'}.</li>
              <li>Missing: preferred hosting and who supplies sponsor assets.</li>
              <li>Suggested 3 milestones: design, build, launch.</li>
            </ul>
          </div>
          ${isMine ? `
            <div class="card">
              <h3>Proposals (${proposals.length}) — you decide</h3>
              ${proposals.map(f => `
                <div style="padding:12px 0;border-top:1px solid var(--line)">
                  <div class="row between">
                    <div class="row">
                      ${av(f.freelancerName || f.name, (parseInt((f.id || '1').replace(/\D/g, '')) || 1))}
                      <div>
                        <b>${f.freelancerName || f.name}</b> ${ver}
                        <div class="mut">${f.department} · ★${(f.stats ? f.stats.reputation : f.rating) || 4.9} · ${(f.stats ? f.stats.onTimeRate : f.onTimeRate) || 96}% on time</div>
                      </div>
                    </div>
                    <span class="match">${f.matchPercent || 92}% Match</span>
                  </div>
                  <p class="mut">“${f.coverLetter || 'I built the Robotics Club portal last semester, so I can start this week and share a Figma draft in 3 days.'}”</p>
                  <div class="row between">
                    <span>${(f.skills || []).map(s => `<span class="tag">${s}</span>`).join(' ')}</span>
                    <b>₹${(f.bidAmount || 5800).toLocaleString('en-IN')} · ${f.deliveryDays || 12} days</b>
                  </div>
                  <div class="row" style="margin-top:8px">
                    <button class="btn s" onclick="doShortlistProposal('${f.id}')">Shortlist</button>
                    <button class="btn s d" onclick="ask('Reject proposal?','Applicant will be notified.',()=>doRejectProposal('${f.id}'))">Reject</button>
                    <button class="btn s p" onclick="ask('Select ${f.freelancerName || f.name}?','Other applicants will be notified and workspace will open.',()=>doSelectProposal('${f.id}', '${p.id}'))">Select</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div class="grid" style="align-content:start">
          <div class="card">
            <div style="font:800 28px 'Bricolage Grotesque'">₹${(p.budget || 6000).toLocaleString('en-IN')}</div>
            <div class="mut">Due ${p.deadline || 'Nov 18'} · ${(p.proposalsCount !== undefined ? p.proposalsCount : 7)} proposals</div>
            ${isMine ? `
              <p class="mut" style="margin-top:10px">This is your project. Only you can manage applicant proposals.</p>
              <button class="btn" style="width:100%" onclick="toast('Opening project editor')">Edit project</button>
            ` : `
              <button class="btn p" style="width:100%;margin-top:10px" onclick="openApplyModal('${p.id}', '${p.title}', ${p.budget})">Apply now</button>
            `}
          </div>
          <div class="card">
            <h3>Client</h3>
            <div class="row">
              ${av(p.clientName || 'Riya Deshmukh', 5)}
              <div>
                <b>${p.clientName || 'Riya Deshmukh'}</b>
                <div>${ver}</div>
                <div class="mut">9 projects posted · ★4.8</div>
              </div>
            </div>
          </div>
          <h3>Recommended freelancers</h3>
          ${cachedFreelancers.slice(0, 2).map(fcard).join('')}
        </div>
      </div>
    `;
  },

  post: () => `
    <h2>Post a project</h2>
    <div class="two">
      <div class="card">
        <label style="margin-top:0">Title</label>
        <input id="pt" placeholder="e.g. Website for college fest, club logo, notes summary...">
        <label>Description</label>
        <textarea id="pd" rows="4" placeholder="Describe the project scope, required deliverables, and expectations..."></textarea>
        <div class="row">
          <div style="flex:1">
            <label>Category</label>
            <select id="pcat"><option>Web Dev</option><option>Design</option><option>App Dev</option><option>Video</option><option>Data</option><option>Writing</option></select>
          </div>
          <div style="flex:1">
            <label>Budget ₹</label>
            <input id="pb" placeholder="e.g. 5000" type="number">
          </div>
          <div style="flex:1">
            <label>Deadline</label>
            <input id="pdl" type="date">
          </div>
        </div>
        <label>Skills</label>
        <input id="ps" placeholder="e.g. React, Figma, Tailwind">
        <label>Deliverables</label>
        <input id="pdeliv" placeholder="e.g. Figma design, deployed site, source code">
        <label>Milestones</label>
        <input id="pm" placeholder="e.g. Design, Build, Launch">
        <div class="row" style="margin-top:14px">
          <button class="btn" onclick="toast('Draft saved')">Save draft</button>
          <button class="btn p" onclick="ask('Publish project?','It becomes visible to verified students on campus.',()=>doPublishProject())">Publish</button>
        </div>
      </div>
      <div class="card" style="align-self:start">
        <h3>AI Requirement Analyzer</h3>
        <p class="mut">Get suggestions and missing requirement warnings. Nothing changes until you accept it.</p>
        <button class="btn p" onclick="analyze(this)">Analyze my project</button>
        <div id="ai"></div>
      </div>
    </div>
  `,

  workspace: () => {
    const t = tab.w || 'Overview';
    const ws = cachedWorkspace || {
      progressPercent: 55,
      chat: [
        { senderName: 'Aditi', text: 'Hi! Homepage preview is up. Check the schedule layout?', timestamp: '10:42 AM', isMe: false },
        { senderName: 'You', text: 'Looks great. Can the register button be sticky on mobile?', timestamp: '11:05 AM', isMe: true },
        { senderName: 'Aditi', text: 'Done, pushing now.', timestamp: '11:20 AM', isMe: false }
      ],
      files: [
        { name: 'technova-design-v3.fig', uploader: 'Aditi', date: 'Oct 05' },
        { name: 'homepage-preview.zip', uploader: 'Aditi', date: 'Oct 13' },
        { name: 'sponsor-logos.zip', uploader: 'Riya', date: 'Oct 02' }
      ],
      timeline: [
        { title: 'Milestone 2 submitted', date: 'Oct 13' },
        { title: 'Milestone 1 approved', date: 'Oct 06' },
        { title: 'Aditi selected as freelancer', date: 'Sep 28' },
        { title: 'Project published', date: 'Sep 20' }
      ]
    };

    return `
      <div class="row between">
        <div>
          <span class="mut">Workspace</span>
          <h2 style="margin:0">Fest website for TechNova 2026</h2>
        </div>
        <div class="row">
          ${bd('In Progress', 'pri')}
          <button class="btn s d" onclick="ask('Report this project?','Admins will review chat and files. You can add details next.',()=>doReportDispute('p1'))">⚑ Report / dispute</button>
        </div>
      </div>
      ${stepper(4)}
      <div class="tabs">
        ${['Overview', 'Milestones', 'Chat', 'Files', 'Timeline'].map(x => `
          <a href="#/workspace" class="${x === t ? 'on' : ''}" onclick="tab.w='${x}';draw();return false">${x}${x === 'Chat' ? ' (' + ws.chat.length + ')' : ''}</a>
        `).join('')}
      </div>
      ${{
        Overview: `
          <div class="two">
            <div class="card">
              <h3>Progress</h3>
              <div class="bar"><i style="width:${ws.progressPercent}%"></i></div>
              <p class="mut">2 of 4 milestones approved · Due Nov 18 (41 days left)</p>
              <h3 style="margin-top:14px">Requirements</h3>
              <p>Responsive fest site with schedule, registration and sponsor pages.</p>
            </div>
            <div class="card">
              <h3>Participants</h3>
              <div class="row">${av('Riya Deshmukh', 1)}<div><b>Riya</b> · Client</div></div>
              <br>
              <div class="row">${av('Aditi Kamble', 3)}<div><b>Aditi</b> · Freelancer</div></div>
            </div>
          </div>
        `,
        Milestones: `
          <div class="grid">
            ${[
              ['m1', 'Design in Figma', 'Oct 05', 'Approved', 'ok', 'Figma prototypes link confirmed'],
              ['m2', 'Homepage + schedule', 'Oct 14', 'Submitted', 'warn', 'Live preview link + bundle'],
              ['m3', 'Registration flow', 'Oct 28', 'In Progress', 'pri', 'To be agreed'],
              ['m4', 'Launch + handover', 'Nov 15', 'Not started', 'mut', 'To be agreed']
            ].map(m => `
              <div class="card">
                <div class="row between"><b>${m[1]}</b>${bd(m[3], m[4])}</div>
                <p class="mut">Due ${m[2]} · Deliverable: ${m[5]}</p>
                ${m[3] === 'Submitted' ? `
                  <div class="row">
                    <button class="btn s p" onclick="ask('Approve milestone?','Marks it complete and releases the agreed value.',()=>doApproveMilestone('p1','${m[0]}'))">Approve</button>
                    <button class="btn s" onclick="ask('Request revision?','Tell Aditi what to change. She will resubmit.',()=>doRevisionMilestone('p1','${m[0]}'))">Request revision</button>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `,
        Chat: `
          <div class="card">
            <div class="mut">Project chat · files stay private to participants</div>
            <div id="chat_box" style="max-height:360px;overflow-y:auto;padding:8px 0">
              ${ws.chat.map(m => `
                <div class="msg ${m.isMe ? 'me' : ''}">
                  ${m.text}
                  <div style="opacity:.7;font-size:11px;margin-top:3px">${m.senderName || 'Student'} · ${m.timestamp || '11:00'} ${m.isMe ? '✓✓' : ''}</div>
                </div>
              `).join('')}
            </div>
            <div class="row" style="margin-top:10px">
              <label class="btn s" style="margin:0;cursor:pointer">
                📎 <input type="file" id="chat_file_input" style="display:none" onchange="doUploadFileFromChat('p1', this)">
              </label>
              <input id="chat_msg_input" placeholder="Write a message" onkeydown="if(event.key==='Enter')doSendChatMessage('p1')">
              <button class="btn p" onclick="doSendChatMessage('p1')">Send</button>
            </div>
          </div>
        `,
        Files: `
          <div class="card">
            <div class="row between">
              <h3>Files ${bd('🔒 Private', 'mut')}</h3>
              <label class="btn s p" style="margin:0;cursor:pointer">
                Upload File <input type="file" style="display:none" onchange="doUploadFile('p1', this)">
              </label>
            </div>
            <table>
              <tr><th>Name</th><th>By</th><th>Date</th></tr>
              ${ws.files.map(f => `
                <tr>
                  <td><a href="${f.url || '#'}" download style="font-weight:600">📄 ${f.name}</a></td>
                  <td>${f.uploader || 'Student'}</td>
                  <td>${f.date || 'Oct 13'}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        `,
        Timeline: `
          <div class="card">
            <div class="tl">
              ${ws.timeline.map(e => `
                <div>${e.title}<div class="mut">${e.date} ${e.desc ? '· ' + e.desc : ''}</div></div>
              `).join('')}
            </div>
          </div>
        `
      }[t]}
    `;
  },

  messages: () => `
    <h2>Messages</h2>
    <div class="card">
      ${[
        ['Aditi Kamble', 'Done, pushing now.', 'Fest website', 2],
        ['Karan Jadhav', 'Can you share the logo draft?', 'Robotics logo', 0],
        ['Omkar Shinde', 'Dataset attached', 'Survey cleaning', 1]
      ].map((m, i) => `
        <a href="#/workspace" onclick="tab.w='Chat'" class="row between" style="color:inherit;padding:10px 0;border-top:${i ? '1px solid var(--line)' : '0'}">
          <div class="row">
            ${av(m[0], i)}
            <div>
              <b>${m[0]}</b> <span class="tag">${m[2]}</span>
              <div class="mut">${m[1]}</div>
            </div>
          </div>
          ${m[3] ? bd(m[3] + ' new', 'pri') : ''}
        </a>
      `).join('')}
    </div>
  `,

  notfound: () => `
    <div class="card" style="text-align:center;padding:50px 20px;max-width:540px;margin:40px auto">
      <div style="font:800 64px 'Bricolage Grotesque';color:var(--pri)">404</div>
      <h2 style="margin:8px 0">Page Not Found</h2>
      <p class="mut" style="font-size:15px">The page or project you requested does not exist on the campus network.</p>
      <div class="row" style="justify-content:center;margin-top:20px;gap:10px">
        <a class="btn p" href="${currentUser ? (currentUser.role === 'admin' ? '#/admin' : '#/dash') : '#/'}">← Return to Safety</a>
        <a class="btn" href="#/discover">Browse Projects</a>
      </div>
    </div>
  `,

  profile: () => {
    const u = currentUser || {
      name: 'Student',
      department: 'CSE',
      year: '2nd year',
      college: 'DYPATU',
      bio: 'Enthusiastic student collaborator and learner on the campus network.',
      skills: ['React', 'Python', 'UI/UX'],
      available: true
    };
    const userSkills = Array.isArray(u.skills) ? u.skills : (typeof u.skills === 'string' ? u.skills.split(',').map(s => s.trim()).filter(Boolean) : ['React', 'Figma', 'Python']);
    const isAvail = u.available !== false;
    const initialName = u.name || 'Student';
    const dept = u.department || u.dept || 'CSE';
    const year = u.year || '2nd year';
    const bio = u.bio || 'Front-end developer who enjoys turning messy club requirements into clean, fast interfaces.';

    return `
      <div class="card">
        <div class="row between">
          <div class="row">
            ${av(initialName, 3)}
            <div>
              <h2 style="margin:0">${initialName}</h2>
              <div>${ver}</div>
              <div class="mut">B.Tech ${dept} · ${year} · ${u.college || 'DYPATU'}</div>
            </div>
          </div>
          <div class="row">
            ${isAvail ? bd('Available now', 'ok') : bd('Busy with projects', 'mut')}
            <button class="btn" onclick="openEditProfileModal()">✏️ Edit profile</button>
          </div>
        </div>
        <p style="margin-top:12px;font-size:15px">${bio}</p>
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card">
          <h3>Skills & Proficiency</h3>
          ${userSkills.length ? userSkills.map((s, idx) => {
            const pct = Math.max(90 - (idx * 6), 60);
            return `
              <div class="row between"><span>${s}</span><span class="mut">${pct >= 85 ? 'Expert' : pct >= 75 ? 'Advanced' : 'Intermediate'}</span></div>
              <div class="bar"><i style="width:${pct}%"></i></div>
            `;
          }).join('<br>') : '<p class="mut">No skills added yet. Click edit profile to add yours.</p>'}
        </div>
        ${rep()}
      </div>
      <div class="card" style="margin-top:14px">
        <h3>Portfolio Projects</h3>
        <div class="grid g3">
          ${['Robotics Club portal', 'Canteen menu app UI', 'Alumni meet landing page'].map((x, i) => `
            <div class="card" style="background:${COL[i]}33"><b>${x}</b><div class="mut">Completed · ★5.0</div></div>
          `).join('')}
        </div>
        <h3 style="margin-top:16px">Recent Campus Reviews</h3>
        <p>“Delivered a day early and handled every change calmly.” <span class="mut">— Sneha P., Design coordinator</span></p>
      </div>
    `;
  },

  reviews: () => `
    <h2>Reputation & reviews</h2>
    <div class="grid g2">
      ${rep()}
      <div class="card">
        <h3>Review Peer / Client</h3>
        <p class="mut">Both sides review after project completion to build verified campus reputation.</p>
        <label>Student to review</label>
        <select id="rev_target">
          <option value="u2">Aditi Kamble (Freelancer)</option>
          <option value="u5">Riya Deshmukh (Client)</option>
        </select>
        ${['Quality', 'Communication', 'Timeliness', 'Requirement adherence'].map((x, idx) => `
          <label>${x}</label>
          <select id="rev_${idx}"><option>5</option><option>4</option><option>3</option></select>
        `).join('')}
        <label>Written review</label>
        <textarea id="rev_comment" rows="3" placeholder="Write feedback..."></textarea>
        <br><br>
        <button class="btn p" onclick="doSubmitReview()">Submit review</button>
      </div>
    </div>
  `,

  projects: () => {
    const C = [
      ['Open', [['Fest website', '7 proposals to review', 'pri', 'Client']]],
      ['In progress', [['Survey data cleaning', 'Due Oct 30', 'pri', 'Freelancer'], ['Showreel edit', 'Due Oct 22 · 2 days late risk', 'warn', 'Freelancer']]],
      ['Needs review', [['Logo kit', 'Submitted Oct 7', 'warn', 'Client']]],
      ['Closed', [['Quiz app', 'Completed', 'ok', 'Client'], ['Mess app', 'Expired', 'mut', 'Client'], ['Poster design', 'Cancelled', 'mut', 'Freelancer'], ['Notes summary', 'Disputed', 'bad', 'Client']]]
    ];
    return `
      <div class="row between"><h2>My projects</h2><a class="btn p" href="#/post">Post project</a></div>
      <div class="grid g4">
        ${C.map(c => `
          <div>
            <div class="row between mut" style="margin-bottom:6px"><b>${c[0]}</b><span>${c[1].length}</span></div>
            ${c[1].map(i => `
              <a href="#/workspace" class="card pc" style="display:block;color:inherit;margin-bottom:10px;--c:var(--${i[2] === 'mut' ? 'line' : i[2] === 'pri' ? 'pri' : i[2]})">
                <b>${i[0]}</b>
                <div class="mut">${i[1]}</div>
                <div class="row between" style="margin-top:6px">
                  <span class="tag">${i[3]}</span>
                  ${bd(c[0] === 'Closed' ? i[1].split(' ')[0] : c[0], i[2])}
                </div>
              </a>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
  },

  proposals: () => `
    <h2>My proposals</h2>
    ${tbl(
      ['Project', 'My bid', 'Status', 'Match', 'Action'],
      [
        ['Data cleaning for survey', '₹1,800', 'Shortlisted', 'ok', 88, 'pr4'],
        ['Department showreel', '₹3,000', 'Pending', 'warn', 68, 'pr_temp1'],
        ['Hostel mess app', '₹8,500', 'Rejected', 'bad', 76, 'pr_temp2'],
        ['DBMS notes summarizer', '₹1,200', 'Pending', 'warn', 72, 'pr_temp3']
      ].map(p => `
        <tr>
          <td><a href="#/project/5">${p[0]}</a></td>
          <td>${p[1]}</td>
          <td>${bd(p[2], p[3])}</td>
          <td>${p[4]}%</td>
          <td>${p[2] === 'Pending' ? `<button class="btn s d" onclick="ask('Withdraw proposal?','Client will no longer see it.',()=>toast('Proposal withdrawn'))">Withdraw</button>` : ''}</td>
        </tr>
      `).join('')
    )}
  `,

  notifications: () => `
    <div class="row between">
      <h2>Notifications</h2>
      <button class="btn s" onclick="doMarkAllRead()">Mark all read</button>
    </div>
    <div class="card">
      ${cachedNotifications.map((n, i) => `
        <div class="row between" style="padding:11px 0;border-top:${i ? '1px solid var(--line)' : '0'}">
          <span>${n.unread ? '<b style="color:var(--pri)">● </b>' : '<span style="margin-right:14px"></span>'}${n.text}</span>
          <span class="mut">${n.time}</span>
        </div>
      `).join('')}
    </div>
  `,

  settings: () => {
    const T = (l, d, on) => `
      <label class="row between" style="font-weight:500;margin:0;padding:10px 0;border-top:1px solid var(--line)">
        <span><b>${l}</b><div class="mut">${d}</div></span>
        <input type="checkbox" style="width:20px;height:20px" ${on ? 'checked' : ''} onchange="toast('Settings saved')">
      </label>
    `;
    return `
      <h2>Settings</h2>
      <div class="grid g2">
        <div class="card">
          <h3>Notifications</h3>
          ${T('New proposals', 'When someone applies to your project', 1)}
          ${T('Deadline reminders', '48 hours before a milestone', 1)}
          ${T('Campus digest', 'Weekly top projects', 0)}
        </div>
        <div class="card">
          <h3>Privacy & security</h3>
          ${T('Portfolio visible to campus only', 'Hidden from search engines', 1)}
          ${T('Show availability', 'Clients can see when you are free', 1)}
          ${T('Two-step login', 'Ask for a code on new devices', 0)}
          <p class="mut" style="margin-top:10px">Signed in on 2 devices · <a href="#/settings" onclick="toast('Signed out other devices')">Sign out others</a></p>
        </div>
        <div class="card" style="border-color:var(--bad)">
          <h3>Delete account</h3>
          <p class="mut">Active projects must be completed or cancelled first.</p>
          <button class="btn d" onclick="ask('Delete your account?','This cannot be undone.',()=>toast('Please finish active projects first'))">Delete account</button>
        </div>
      </div>
    `;
  },

  admin: () => `
    <h2>Admin overview</h2>
    <div class="grid g4">
      ${stat('Verified students', '2,418', '+86 this month')}
      ${stat('Active projects', '134')}
      ${stat('Completed projects', '612')}
      ${stat('Pending verification', '23')}
      ${stat('Open reports', '5', '2 high priority')}
      ${stat('Completion rate', '91%')}
    </div>
    <div class="grid g2" style="margin-top:14px">
      <div class="card">
        <h3>Project & participation trend</h3>
        ${line([20, 28, 35, 33, 48, 60, 72], [300, 420, 510, 560, 700, 880, 960])}
      </div>
      <div class="card">
        <h3>Most requested skills</h3>
        ${bars([['React', 48], ['Figma', 41], ['Python', 36], ['Video', 27], ['Flutter', 22]])}
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <h3>Fraud & risk alerts</h3>
      <table>
        <tr><th>Alert</th><th>User</th><th>Level</th><th></th></tr>
        <tr><td>Asked to chat off-platform</td><td>user_1187</td><td>${bd('High', 'bad')}</td><td><button class="btn s" onclick="toast('Investigation case opened')">Review</button></td></tr>
        <tr><td>5 identical proposals in 10 min</td><td>user_0932</td><td>${bd('Medium', 'warn')}</td><td><button class="btn s" onclick="toast('Investigation case opened')">Review</button></td></tr>
      </table>
    </div>
  `,

  'admin-verify': () => `
    <h2>Verification queue</h2>
    <div class="card">
      <table>
        <tr><th>Student</th><th>Email</th><th>ID card</th><th>Action</th></tr>
        ${[
          ['v1', 'Pratik Mane', 'pratik@dypatu.edu.in'],
          ['v2', 'Neha Salunkhe', 'neha@dypatu.edu.in'],
          ['v3', 'Vishal Patil', 'vishal@dypatu.edu.in']
        ].map(s => `
          <tr id="row_${s[0]}">
            <td>${s[1]}</td>
            <td>${s[2]}</td>
            <td>${bd('Uploaded', 'mut')}</td>
            <td>
              <button class="btn s p" onclick="doApproveVerification('${s[0]}','${s[1]}')">Approve</button>
              <button class="btn s d" onclick="ask('Reject ${s[1]}?','They will be asked to resubmit.',()=>doRejectVerification('${s[0]}','${s[1]}'))">Reject</button>
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  `,

  'admin-skills': () => `
    <h2>Skill demand & supply</h2>
    <div class="card">
      <table>
        <tr><th>Skill</th><th>Demand</th><th>Supply</th><th>Gap</th></tr>
        ${[
          ['Flutter', 22, 6],
          ['Video editing', 27, 11],
          ['React', 48, 40],
          ['Python', 36, 34],
          ['Technical writing', 9, 15]
        ].map(s => `
          <tr>
            <td>${s[0]}</td>
            <td>${s[1]}</td>
            <td>${s[2]}</td>
            <td>${s[1] - s[2] > 8 ? bd('Under-supplied', 'bad') : s[1] < s[2] ? bd('Surplus', 'mut') : bd('Balanced', 'ok')}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `,

  'admin-reports': () => `
    <h2>Reports & disputes</h2>
    <div class="card">
      <table>
        <tr><th>Case</th><th>Project</th><th>Status</th><th></th></tr>
        <tr><td>#R-212 Missed deadline</td><td>Showreel edit</td><td>${bd('Disputed', 'bad')}</td><td><button class="btn s" onclick="toast('Opened dispute details')">Open</button></td></tr>
        <tr><td>#R-209 Rude messages</td><td>Hostel app</td><td>${bd('In review', 'warn')}</td><td><button class="btn s" onclick="toast('Opened dispute details')">Open</button></td></tr>
      </table>
    </div>
  `,

  'admin-users': () => `
    <div class="row between">
      <h2>User management</h2>
      <input style="max-width:240px" placeholder="Search students" oninput="document.querySelectorAll('#ut tr.u').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(this.value.toLowerCase()))">
    </div>
    ${tbl(
      ['Student', 'Department', 'Projects', 'Status', ''],
      `<tbody id="ut">` + [
        ['u1', 'Student User', 'CSE', 23, 'Active'],
        ['u2', 'Aditi Kamble', 'CSE', 23, 'Active'],
        ['u3', 'Rohan Gaikwad', 'IT', 14, 'Active'],
        ['u4', 'Meera Joshi', 'ENTC', 19, 'Active'],
        ['u_flag', 'user_1187', 'Mech', 2, 'Flagged'],
        ['u_susp', 'Pratik Mane', 'Civil', 0, 'Suspended']
      ].map(u => `
        <tr class="u">
          <td>${u[1]}</td>
          <td>${u[2]}</td>
          <td>${u[3]}</td>
          <td>${bd(u[4], u[4] === 'Active' ? 'ok' : u[4] === 'Flagged' ? 'warn' : 'bad')}</td>
          <td><button class="btn s ${u[4] === 'Suspended' ? '' : 'd'}" onclick="ask('${u[4] === 'Suspended' ? 'Reinstate' : 'Suspend'} ${u[1]}?','This is recorded in the audit log.',()=>doToggleUserStatus('${u[0]}','${u[1]}'))">${u[4] === 'Suspended' ? 'Reinstate' : 'Suspend'}</button></td>
        </tr>
      `).join('') + `</tbody>`
    )}
  `,

  'admin-mod': () => `
    <h2>Moderation</h2>
    <div class="grid g2">
      ${[
        ['m1', 'Project “Write my assignment”', 'Possible academic dishonesty', 'user_0932'],
        ['m2', 'Chat message in Showreel edit', 'Asked to pay outside SkillEx', 'user_1187'],
        ['m3', 'Profile bio', 'Contains phone number', 'user_1450']
      ].map(m => `
        <div class="card" id="mod_${m[0]}">
          <div class="row between"><b>${m[1]}</b>${bd('Pending', 'warn')}</div>
          <p class="mut">${m[2]} · ${m[3]}</p>
          <div class="row">
            <button class="btn s p" onclick="doModerate('${m[0]}','remove')">Remove</button>
            <button class="btn s" onclick="doModerate('${m[0]}','warn')">Warn user</button>
            <button class="btn s" onclick="doModerate('${m[0]}','dismiss')">Dismiss</button>
          </div>
        </div>
      `).join('')}
    </div>
  `,

  'admin-logs': () => `
    <h2>Audit logs</h2>
    ${tbl(
      ['Time', 'Admin', 'Action', 'Target'],
      [
        ['10:42', 'admin.ritu', 'Approved verification', 'Neha Salunkhe'],
        ['10:15', 'admin.ritu', 'Removed project', '“Write my assignment”'],
        ['Yesterday', 'admin.sam', 'Suspended user', 'Pratik Mane'],
        ['Yesterday', 'system', 'Raised risk alert', 'user_1187']
      ].map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
    )}
  `
};

// Command Palette & Modal Backdrop Dismissal
const pal = document.createElement('dialog');
pal.style.cssText = 'width:min(520px,92vw);max-width:none;padding:12px;margin-top:12vh';
pal.innerHTML = '<input id="ci" placeholder="Jump to… (try: post, messages, discover, admin)"><div id="cl" style="margin-top:10px;max-height:300px;overflow-y:auto"></div>';
document.body.appendChild(pal);

// Close dialog when clicking anywhere on the blank space (backdrop)
function enableBackdropDismiss(dialog) {
  if (!dialog) return;
  dialog.addEventListener('click', e => {
    const rect = dialog.getBoundingClientRect();
    const isInside = (
      rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width
    );
    if (!isInside) {
      dialog.close();
    }
  });
}

enableBackdropDismiss(pal);
if (dlg) enableBackdropDismiss(dlg);

// Global listener to dismiss any open modal when clicking the blank space outside
document.addEventListener('click', e => {
  if (e.target && e.target.tagName === 'DIALOG' && e.target.open) {
    const rect = e.target.getBoundingClientRect();
    const isInside = (
      rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width
    );
    if (!isInside) {
      e.target.close();
    }
  }
});

function pl() {
  const q = ($('#ci').value || '').trim().toLowerCase();
  const navItems = (NAV[role] || NAV.student).filter(n => n[2].toLowerCase().includes(q));
  
  let html = '';
  if (navItems.length) {
    html += `<div style="font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:0.5px;margin:6px 8px 4px">Navigation</div>`;
    html += navItems.map(n => `
      <a class="row" style="padding:9px;color:var(--ink);border-radius:8px;transition:background 0.15s" href="#/${n[0]}" onclick="pal.close()">
        <span>${n[1]}</span> <b>${n[2]}</b>
      </a>
    `).join('');
  }

  // Also search projects
  if (q && cachedProjects.length) {
    const projMatches = cachedProjects.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.skills || []).some(s => s.toLowerCase().includes(q))
    ).slice(0, 4);

    if (projMatches.length) {
      html += `<div style="font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:0.5px;margin:12px 8px 4px">Projects</div>`;
      html += projMatches.map(p => `
        <a class="row between" style="padding:9px;color:var(--ink);border-radius:8px;transition:background 0.15s" href="#/project/${p.id}" onclick="pal.close()">
          <span style="font-weight:600">📁 ${p.title}</span>
          <span class="tag" style="font-size:11px">${p.category || 'Web'} · ₹${(p.budget || 3000).toLocaleString('en-IN')}</span>
        </a>
      `).join('');
    }
  }

  // Also search students
  if (q && cachedFreelancers.length) {
    const freeMatches = cachedFreelancers.filter(f =>
      (f.name || '').toLowerCase().includes(q) ||
      (f.department || '').toLowerCase().includes(q) ||
      (f.skills || []).some(s => s.toLowerCase().includes(q))
    ).slice(0, 3);

    if (freeMatches.length) {
      html += `<div style="font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:0.5px;margin:12px 8px 4px">Students & Freelancers</div>`;
      html += freeMatches.map(f => `
        <a class="row between" style="padding:9px;color:var(--ink);border-radius:8px;transition:background 0.15s" href="#/profile" onclick="pal.close()">
          <span style="font-weight:600">🎓 ${f.name}</span>
          <span class="mut" style="font-size:11px">${f.department}</span>
        </a>
      `).join('');
    }
  }

  $('#cl').innerHTML = html || '<div class="empty">No matching pages, projects, or students</div>';
}

function openPal() {
  $('#ci').value = '';
  pl();
  pal.showModal();
  $('#ci').focus();
}
$('#ci').oninput = pl;
addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openPal();
  }
});

// Interactive AI Analyzer
async function analyze(b) {
  const a = $('#ai');
  const title = ($('#pt') && $('#pt').value) || '';
  const desc = ($('#pd') && $('#pd').value) || '';
  const category = ($('#pcat') && $('#pcat').value) || 'Web Dev';

  a.innerHTML = '<div class="skel"></div><div class="skel" style="width:70%"></div><div class="skel"></div>';
  b.disabled = true;

  try {
    const res = await API.ai.analyze(title, desc, category);
    b.disabled = false;
    a.innerHTML = `
      <div class="sug">
        <b>Suggestions</b> ${bd('AI · editable', 'pri')}
        <p><b>Title:</b> ${res.title} <button class="btn s" onclick="$('#pt').value='${res.title.replace(/'/g, "\\'")}';toast('Title applied')">Use</button></p>
        <p><b>Skills:</b> ${res.skillsString} <button class="btn s" onclick="$('#ps').value='${res.skillsString.replace(/'/g, "\\'")}';toast('Skills added')">Add</button></p>
        <p><b>Deliverables:</b> ${res.deliverablesString} <button class="btn s" onclick="$('#pdeliv').value='${res.deliverablesString.replace(/'/g, "\\'")}';toast('Added')">Add</button></p>
        <p><b>Milestones:</b> ${res.milestonesString} <button class="btn s" onclick="$('#pm').value='${res.milestonesString.replace(/'/g, "\\'")}';toast('Added')">Add</button></p>
        ${res.missingItems && res.missingItems.length ? `<p class="warn" style="color:var(--warn)"><b>Missing:</b> ${res.missingItems.join(', ')}.</p>` : ''}
        <p><b>Complexity:</b> ${res.complexity} · estimated ${res.estimatedHours}</p>
      </div>
    `;
  } catch (err) {
    b.disabled = false;
    a.innerHTML = `<div class="sug" style="border-color:var(--bad)">Error running AI analyzer: ${err.message}</div>`;
  }
}

// Auth Helper Functions
function togglePassVisibility(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = '🙈';
  } else {
    inp.type = 'password';
    btn.textContent = '👁️';
  }
}

function authOtpMove(el, nextIdx) {
  if (el.value.length >= 1) {
    el.value = el.value.slice(0, 1);
    const allInputs = document.querySelectorAll('.auth-otp-digit');
    if (nextIdx < allInputs.length) {
      allInputs[nextIdx].focus();
    } else {
      collectOtpAndVerify();
    }
  }
}

function collectOtpAndVerify() {
  const digits = document.querySelectorAll('.auth-otp-digit');
  const otp = Array.from(digits).map(d => d.value).join('');
  const hidden = document.getElementById('otp_val');
  if (hidden) hidden.value = otp;
  doVerifyOtp();
}

function addSkillToInput(skill, pill) {
  const inp = document.getElementById('onb_skills');
  if (!inp) return;
  const current = inp.value.split(',').map(s => s.trim()).filter(Boolean);
  if (current.includes(skill)) {
    // remove
    inp.value = current.filter(s => s !== skill).join(', ');
    pill.classList.remove('selected');
  } else {
    current.push(skill);
    inp.value = current.join(', ');
    pill.classList.add('selected');
  }
}

// Handle paste into OTP fields
document.addEventListener('paste', e => {
  const digits = document.querySelectorAll('.auth-otp-digit');
  if (!digits.length) return;
  const active = document.activeElement;
  if (!active || !active.classList.contains('auth-otp-digit')) return;
  e.preventDefault();
  const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
  pasted.split('').forEach((ch, i) => {
    if (digits[i]) digits[i].value = ch;
  });
  const focusIdx = Math.min(pasted.length, digits.length - 1);
  if (digits[focusIdx]) digits[focusIdx].focus();
});

// Handle backspace in OTP fields
document.addEventListener('keydown', e => {
  if (e.key === 'Backspace' && e.target && e.target.classList.contains('auth-otp-digit')) {
    if (!e.target.value) {
      const allInputs = document.querySelectorAll('.auth-otp-digit');
      const idx = Array.from(allInputs).indexOf(e.target);
      if (idx > 0) {
        allInputs[idx - 1].focus();
        allInputs[idx - 1].value = '';
      }
    }
  }
});

// Action Handlers
let pendingRegEmail = '';
let otpTimerInterval = null;

function updateAppTitle() {
  const unreadCount = cachedNotifications.filter(n => n.unread).length;
  const prefix = unreadCount > 0 ? `(${unreadCount}) ` : '';
  document.title = `${prefix}SkillEx · Campus Freelancing & Peer Collaboration`;
}

function autoFillDemoOtp(code = '482913') {
  const digits = document.querySelectorAll('.auth-otp-digit');
  code.split('').forEach((c, i) => { if (digits[i]) digits[i].value = c; });
  const hidden = document.getElementById('otp_val');
  if (hidden) hidden.value = code;
  collectOtpAndVerify();
}

function startOtpCountdown(seconds = 600) {
  if (otpTimerInterval) clearInterval(otpTimerInterval);
  let remaining = seconds;
  const updateDisplay = () => {
    const el = document.getElementById('otpTimer');
    const wrap = document.getElementById('otpTimerWrap');
    if (!el) return;
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
    if (remaining <= 60 && wrap) wrap.classList.add('expiring');
    if (remaining <= 0) {
      clearInterval(otpTimerInterval);
      el.textContent = 'Expired';
    }
    remaining--;
  };
  updateDisplay();
  otpTimerInterval = setInterval(updateDisplay, 1000);
}

function openEditProfileModal() {
  const dlg = document.getElementById('profileDlg');
  if (!dlg) return;
  const u = currentUser || {};
  const deptSelect = document.getElementById('edit_prof_dept');
  const yearSelect = document.getElementById('edit_prof_year');
  const bioInput = document.getElementById('edit_prof_bio');
  const skillsInput = document.getElementById('edit_prof_skills');
  const availInput = document.getElementById('edit_prof_avail');

  if (deptSelect) deptSelect.value = u.department || u.dept || 'CSE';
  if (yearSelect) yearSelect.value = u.year || '2nd year';
  if (bioInput) bioInput.value = u.bio || '';
  if (skillsInput) {
    const s = Array.isArray(u.skills) ? u.skills.join(', ') : (u.skills || '');
    skillsInput.value = s;
  }
  if (availInput) availInput.checked = u.available !== false;

  dlg.showModal();
}

async function doSaveProfile() {
  const dept = document.getElementById('edit_prof_dept').value;
  const year = document.getElementById('edit_prof_year').value;
  const bio = document.getElementById('edit_prof_bio').value.trim();
  const rawSkills = document.getElementById('edit_prof_skills').value;
  const available = document.getElementById('edit_prof_avail').checked;
  const skills = rawSkills.split(',').map(s => s.trim()).filter(Boolean);

  const saveBtn = document.getElementById('saveProfBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
  }

  try {
    await API.auth.updateProfile({
      userId: currentUser ? currentUser.id : 'u1',
      bio,
      department: dept,
      skills,
      available
    });

    if (currentUser) {
      currentUser.bio = bio;
      currentUser.department = dept;
      currentUser.year = year;
      currentUser.skills = skills;
      currentUser.available = available;
      localStorage.setItem('skillex_user', JSON.stringify(currentUser));
    }

    const dlg = document.getElementById('profileDlg');
    if (dlg) dlg.close();
    toast('Profile updated successfully!');
    draw();
  } catch (err) {
    toast(err.message || 'Failed to save profile');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Profile';
    }
  }
}

async function doLogin(roleType = 'student') {
  const emailInput = $('#login_email');
  const passInput = $('#login_pass');
  if (!emailInput || !passInput) return;
  const email = emailInput.value.trim();
  const password = passInput.value.trim();

  // Reset errors
  emailInput.classList.remove('input-error');
  passInput.classList.remove('input-error');

  if (!email) {
    emailInput.classList.add('input-error', 'shake');
    setTimeout(() => emailInput.classList.remove('shake'), 400);
    toast('Please enter your email.');
    emailInput.focus();
    return;
  }

  if (!password) {
    passInput.classList.add('input-error', 'shake');
    setTimeout(() => passInput.classList.remove('shake'), 400);
    toast('Please enter your password.');
    passInput.focus();
    return;
  }

  const btn = document.querySelector('.auth-btn');
  const origBtnText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner"></span> Signing in...`;
  }

  try {
    const res = await API.auth.login(email, password, roleType);
    currentUser = res.user;
    role = currentUser.role;
    localStorage.setItem('skillex_user', JSON.stringify(currentUser));
    if (res.token) {
      localStorage.setItem('skillex_token', res.token);
    }
    if (currentUser.role === 'admin') {
      toast(`Signed in to Administration Console: ${currentUser.name}`);
      location.hash = '#/admin';
    } else {
      toast(`Welcome back, ${currentUser.name}!`);
      location.hash = '#/dash';
    }
  } catch (err) {
    toast(err.message);
    if (emailInput) {
      emailInput.classList.add('input-error', 'shake');
      setTimeout(() => emailInput.classList.remove('shake'), 400);
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtnText;
    }
  }
}

function doLogout() {
  ask('Log out of SkillEx?', 'Your active session will be closed on this computer.', () => {
    currentUser = null;
    localStorage.removeItem('skillex_user');
    localStorage.removeItem('skillex_token');
    role = 'guest';
    toast('Logged out successfully.');
    location.hash = '#/';
    draw();
  });
}

async function doRegister() {
  const nameInput = $('#reg_name');
  const emailInput = $('#reg_email');
  if (!nameInput || !emailInput) return;
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  nameInput.classList.remove('input-error');
  emailInput.classList.remove('input-error');

  if (!name) {
    nameInput.classList.add('input-error', 'shake');
    setTimeout(() => nameInput.classList.remove('shake'), 400);
    toast('Please enter your full name.');
    nameInput.focus();
    return;
  }

  if (!email || !email.includes('@')) {
    emailInput.classList.add('input-error', 'shake');
    setTimeout(() => emailInput.classList.remove('shake'), 400);
    toast('Please enter a valid college email address.');
    emailInput.focus();
    return;
  }

  const btn = document.querySelector('.auth-btn');
  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner"></span> Sending OTP...`;
  }

  try {
    await API.auth.register(name, email);
    pendingRegEmail = email;
    toast('Verification OTP sent to ' + email);
    location.hash = '#/auth/otp';
    setTimeout(() => startOtpCountdown(), 100);
  } catch (err) {
    toast(err.message);
    emailInput.classList.add('input-error', 'shake');
    setTimeout(() => emailInput.classList.remove('shake'), 400);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

async function doVerifyOtp() {
  const otp = $('#otp_val') ? $('#otp_val').value.trim() : '';
  if (!otp || otp.length < 6) {
    const firstDigit = document.querySelector('.auth-otp-digit');
    if (firstDigit) {
      document.querySelectorAll('.auth-otp-digit').forEach(d => {
        d.classList.add('input-error', 'shake');
        setTimeout(() => d.classList.remove('shake'), 400);
      });
      firstDigit.focus();
    }
    toast('Please enter all 6 digits of your verification code.');
    return;
  }

  const email = pendingRegEmail || ($('#reg_email') ? $('#reg_email').value.trim() : '');
  const btn = $('#verifyOtpBtn');
  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner"></span> Verifying...`;
  }

  try {
    const res = await API.auth.verifyOtp(email, otp);
    currentUser = res.user;
    localStorage.setItem('skillex_user', JSON.stringify(currentUser));
    if (res.token) {
      localStorage.setItem('skillex_token', res.token);
    }
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    toast('Email verified successfully!');
    location.hash = '#/auth/onboarding';
  } catch (err) {
    toast(err.message);
    document.querySelectorAll('.auth-otp-digit').forEach(d => {
      d.classList.add('input-error', 'shake');
      setTimeout(() => d.classList.remove('shake'), 400);
    });
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

function doForgotPassword() {
  toast('Password reset link sent to your college inbox');
  location.hash = '#/auth/login';
}

function doFinishOnboarding() {
  toast('Profile setup complete!');
  location.hash = '#/dash';
}

async function doPublishProject() {
  const titleInput = $('#pt');
  const descInput = $('#pd');
  const catInput = $('#pcat');
  const budgetInput = $('#pb');
  const dlInput = $('#pdl');
  const skillsInput = $('#ps');
  const delivInput = $('#pdeliv');
  const mInput = $('#pm');

  const title = titleInput ? titleInput.value.trim() : '';
  const description = descInput ? descInput.value.trim() : '';
  const category = catInput ? catInput.value : 'Web Dev';
  const budget = budgetInput ? parseInt(budgetInput.value) : 0;
  const deadline = dlInput ? dlInput.value : '';
  const skills = skillsInput ? skillsInput.value.trim() : '';
  const deliverables = delivInput ? delivInput.value.trim() : '';
  const milestones = mInput ? mInput.value.trim() : '';

  if (!title) {
    if (titleInput) {
      titleInput.classList.add('input-error', 'shake');
      setTimeout(() => titleInput.classList.remove('shake'), 400);
      titleInput.focus();
    }
    toast('Please enter a project title.');
    return;
  }

  if (!description) {
    if (descInput) {
      descInput.classList.add('input-error', 'shake');
      setTimeout(() => descInput.classList.remove('shake'), 400);
      descInput.focus();
    }
    toast('Please describe the project scope.');
    return;
  }

  if (!budget || budget < 500) {
    if (budgetInput) {
      budgetInput.classList.add('input-error', 'shake');
      setTimeout(() => budgetInput.classList.remove('shake'), 400);
      budgetInput.focus();
    }
    toast('Minimum project budget on SkillEx is ₹500.');
    return;
  }

  try {
    const res = await API.projects.create({
      title,
      description,
      category,
      budget,
      deadline,
      skills,
      deliverables,
      milestones,
      clientId: currentUser ? currentUser.id : 'u1',
      clientName: currentUser ? currentUser.name : 'Student'
    });
    toast('Project published to campus noticeboard!');
    await loadInitialData();
    location.hash = `#/project/${res.project.id}`;
  } catch (err) {
    toast(err.message);
  }
}

function openApplyModal(projectId, title, budget) {
  ask(
    `Apply to "${title}"?`,
    `Send proposal with your campus profile and portfolio.`,
    async () => {
      try {
        await API.proposals.create({
          projectId,
          freelancerId: currentUser.id,
          bidAmount: budget,
          deliveryDays: 10,
          coverLetter: `Hi, I am interested in collaborating on this. Relevant experience in ${currentUser.dept}.`
        });
        toast('Proposal successfully submitted!');
        await loadInitialData();
        draw();
      } catch (err) {
        toast(err.message);
      }
    }
  );
}

async function doShortlistProposal(id) {
  try {
    await API.proposals.shortlist(id);
    toast('Candidate shortlisted');
    await loadInitialData();
    draw();
  } catch (err) {
    toast(err.message);
  }
}

async function doRejectProposal(id) {
  try {
    await API.proposals.reject(id);
    toast('Proposal rejected');
    await loadInitialData();
    draw();
  } catch (err) {
    toast(err.message);
  }
}

async function doSelectProposal(proposalId, projectId) {
  try {
    await API.proposals.select(proposalId);
    toast('Freelancer selected! Workspace active.');
    await loadInitialData();
    location.hash = '#/workspace';
  } catch (err) {
    toast(err.message);
  }
}

async function doApproveMilestone(projectId, milestoneId) {
  try {
    await API.workspace.approveMilestone(projectId, milestoneId);
    toast('Milestone approved! Funds released.');
    await loadInitialData();
    draw();
  } catch (err) {
    toast(err.message);
  }
}

async function doRevisionMilestone(projectId, milestoneId) {
  try {
    await API.workspace.requestRevision(projectId, milestoneId, 'Please adjust responsive layout on mobile');
    toast('Revision request sent to freelancer.');
    await loadInitialData();
    draw();
  } catch (err) {
    toast(err.message);
  }
}

async function doSendChatMessage(projectId) {
  const input = $('#chat_msg_input');
  if (!input || !input.value.trim()) return;
  const text = input.value.trim();
  input.value = '';

  try {
    await API.workspace.sendChat(projectId, text, currentUser.name, true);
    await loadInitialData();
    draw();
    setTimeout(() => {
      const box = $('#chat_box');
      if (box) box.scrollTop = box.scrollHeight;
    }, 50);
  } catch (err) {
    toast(err.message);
  }
}

async function doUploadFile(projectId, fileInput) {
  if (!fileInput.files || !fileInput.files[0]) return;
  const file = fileInput.files[0];
  try {
    await API.workspace.uploadFile(projectId, file, currentUser.name);
    toast(`Uploaded: ${file.name}`);
    await loadInitialData();
    draw();
  } catch (err) {
    toast(err.message);
  }
}

async function doUploadFileFromChat(projectId, fileInput) {
  await doUploadFile(projectId, fileInput);
}

async function doReportDispute(projectId) {
  try {
    await API.workspace.dispute(projectId, 'Milestone delivery concern', 'Review requested by participant.', currentUser.name);
    toast('Dispute filed. Admin moderation team notified.');
  } catch (err) {
    toast(err.message);
  }
}

async function doSubmitReview() {
  const targetUserId = $('#rev_target').value;
  const q = $('#rev_0').value;
  const c = $('#rev_1').value;
  const t = $('#rev_2').value;
  const a = $('#rev_3').value;
  const comment = $('#rev_comment').value;

  try {
    await API.reviews.submit({
      targetUserId,
      reviewerName: currentUser.name,
      quality: q,
      communication: c,
      timeliness: t,
      adherence: a,
      comment
    });
    toast('Peer review submitted successfully!');
    location.hash = '#/profile';
  } catch (err) {
    toast(err.message);
  }
}

async function doMarkAllRead() {
  try {
    await API.notifications.markRead();
    cachedNotifications.forEach(n => (n.unread = false));
    updateAppTitle();
    draw();
    toast('All marked as read');
  } catch (err) {
    toast(err.message);
  }
}

async function doApproveVerification(id, name) {
  try {
    await API.admin.approveVerification(id);
    toast(`${name} verified!`);
    const r = $(`#row_${id}`);
    if (r) r.remove();
  } catch (err) {
    toast(err.message);
  }
}

async function doRejectVerification(id, name) {
  try {
    await API.admin.rejectVerification(id);
    toast(`Rejected ${name}`);
    const r = $(`#row_${id}`);
    if (r) r.remove();
  } catch (err) {
    toast(err.message);
  }
}

async function doModerate(id, action) {
  try {
    await API.admin.moderateItem(id, action);
    toast(`Content ${action}d`);
    const c = $(`#mod_${id}`);
    if (c) c.remove();
  } catch (err) {
    toast(err.message);
  }
}

async function doToggleUserStatus(id, name) {
  try {
    const res = await API.admin.toggleUserStatus(id);
    toast(`${name} status updated to: ${res.status}`);
    draw();
  } catch (err) {
    toast(err.message);
  }
}

// Initial Data Loader
async function loadInitialData() {
  try {
    const [pRes, nRes, wsRes] = await Promise.all([
      API.projects.getAll().catch(() => ({ projects: [] })),
      API.notifications.getAll().catch(() => ({ notifications: [] })),
      API.workspace.get('p1').catch(() => null)
    ]);

    cachedProjects = pRes.projects || [];
    cachedNotifications = nRes.notifications || [];
    if (wsRes) cachedWorkspace = wsRes.workspace;
    updateAppTitle();

    // Default mock freelancers
    cachedFreelancers = [
      { id: 'u2', name: 'Aditi Kamble', department: 'CSE, 3rd year', matchPercent: 92, stats: { reputation: 4.9, onTimeRate: 96 }, skills: ['React', 'Figma', 'Tailwind', 'TypeScript'], whyPoints: ['5/6 required skills matched', '3 relevant portfolio projects', '96% on-time completion', 'Available before deadline'] },
      { id: 'u3', name: 'Rohan Gaikwad', department: 'IT, 2nd year', matchPercent: 85, stats: { reputation: 4.7, onTimeRate: 91 }, skills: ['React', 'Node', 'Figma'], whyPoints: ['4/6 required skills matched', '2 relevant portfolio projects', '91% on-time completion', 'Available from Oct 20'] },
      { id: 'u4', name: 'Meera Joshi', department: 'ENTC, 3rd year', matchPercent: 79, stats: { reputation: 4.8, onTimeRate: 98 }, skills: ['Figma', 'UI/UX', 'Branding'], whyPoints: ['3/6 required skills matched', '4 design portfolio projects', '98% on-time completion', 'Limited availability'] }
    ];
  } catch (e) {
    console.error('Initial data load warning:', e);
  }
}

// Render Engine
function draw(keep) {
  const h = location.hash.slice(2) || 'landing';
  const [r, a] = h.split('/');
  const adm = r.startsWith('admin');
  const pub = r === 'landing' || r === 'auth' || r === '';

  // 1. Authentication & Route Protection
  if (!currentUser && !pub) {
    toast('Please sign in to access this page.');
    location.hash = '#/auth/login';
    return;
  }

  // 2. Role Security Check
  if (currentUser && currentUser.role === 'student' && adm) {
    toast('Access Denied: Campus Administrator clearance required.');
    location.hash = '#/dash';
    return;
  }

  // Determine current active view body
  let body;
  if (!r || r === 'landing') {
    body = V.landing();
  } else if (r === 'auth') {
    body = V.auth(a);
    if (a === 'otp') {
      setTimeout(startOtpCountdown, 50);
    }
  } else if (r === 'project') {
    body = V.project(a);
  } else if (V[r]) {
    body = V[r]();
  } else {
    body = V.notfound();
  }

  updateAppTitle();

  const f = keep && document.activeElement && document.activeElement.id === 'q';
  const unreadCount = cachedNotifications.filter(n => n.unread).length;

  // 3. Render Views Based on Distinct Roles
  if (currentUser && currentUser.role === 'admin') {
    // --- COMPLETELY SEPARATE ADMIN VIEW ---
    $('#app').innerHTML = `
      <div class="admin-shell">
        <header class="admin-header">
          <a class="logo" href="#/admin" style="color:#ffffff">Skill<i>Ex</i></a>
          <span class="admin-badge">🛡️ FACULTY ADMIN CONSOLE</span>
          <span class="mut" style="color:#94a3b8;font-size:12px;margin-left:6px;display:flex;align-items:center">
            <span class="admin-status-dot"></span>Campus Node Online
          </span>
          <span class="sp"></span>
          <span style="font-weight:600;font-size:13px;color:#e2e8f0;display:flex;align-items:center;gap:6px">
            ${av(currentUser.name, 4)} ${currentUser.name}
          </span>
          <button class="btn s" style="background:#1e293b;border-color:#334155;color:#f8fafc" onclick="toggleTheme()" aria-label="Toggle theme">◐</button>
          <button class="btn s d" style="border-color:#dc2626;background:rgba(220,38,38,0.2)" onclick="doLogout()">🚪 Log Out</button>
        </header>
        <div class="admin-layout">
          <nav class="admin-nav">
            <div class="admin-nav-heading">Campus Analytics</div>
            <a href="#/admin" class="${r === 'admin' ? 'on' : ''}"><span>📊</span> Command Overview</a>
            <a href="#/admin-skills" class="${r === 'admin-skills' ? 'on' : ''}"><span>📈</span> Skill Demand Matrix</a>

            <div class="admin-nav-heading">Student KYC & Directory</div>
            <a href="#/admin-verify" class="${r === 'admin-verify' ? 'on' : ''}"><span>🎓</span> Verification Queue</a>
            <a href="#/admin-users" class="${r === 'admin-users' ? 'on' : ''}"><span>👥</span> Student Directory</a>

            <div class="admin-nav-heading">Trust & Compliance</div>
            <a href="#/admin-mod" class="${r === 'admin-mod' ? 'on' : ''}"><span>🛡️</span> Moderation Queue</a>
            <a href="#/admin-reports" class="${r === 'admin-reports' ? 'on' : ''}"><span>⚖️</span> Dispute Cases</a>
            <a href="#/admin-logs" class="${r === 'admin-logs' ? 'on' : ''}"><span>📜</span> Audit Trails</a>
          </nav>
          <main class="admin-main">${body}</main>
        </div>
      </div>
    `;
  } else if (currentUser && currentUser.role === 'student') {
    // --- COMPLETELY SEPARATE STUDENT VIEW ---
    $('#app').innerHTML = `
      <header>
        <a class="logo" href="#/dash">Skill<i>Ex</i></a>
        <span class="sp"></span>
        <button class="btn s" onclick="openPal()" aria-label="Search">⌕ Ctrl K</button>
        <a class="btn s" href="#/notifications" aria-label="Notifications">🔔 ${unreadCount}</a>
        <span class="row" style="padding:4px 10px;border-radius:10px;background:var(--soft);margin:0 4px">
          ${av(currentUser.name, 1)}
          <span style="font-weight:700;font-size:13px">${currentUser.name}</span>
          <span class="ver">✔</span>
        </span>
        <button class="btn s" onclick="toggleTheme()" aria-label="Toggle theme">◐</button>
        <button class="btn s d" onclick="doLogout()">Log out</button>
      </header>
      <div class="layout">
        <nav>
          ${NAV.student.map(n => `
            <a href="#/${n[0]}" class="${r === n[0] || (n[0] === 'discover' && r === 'project') ? 'on' : ''}">
              <span>${n[1]}</span>${n[2]}
            </a>
          `).join('')}
          <small>Private files · Verified campus only</small>
        </nav>
        <main>${body}</main>
      </div>
    `;
  } else {
    // --- PUBLIC / GUEST VIEW ---
    const isAuth = r === 'auth';
    $('#app').innerHTML = `
      <header>
        <a class="logo" href="#/">Skill<i>Ex</i></a>
        <span class="sp"></span>
        <a class="btn s" href="#/auth/login" onclick="loginPortal='student'">Student Login</a>
        <a class="btn s" style="background:#0f172a;color:#f8fafc;border-color:#1e293b" href="#/auth/login" onclick="loginPortal='admin'">Admin Portal</a>
        <a class="btn s p" href="#/auth/register">Join Campus</a>
        <button class="btn s" onclick="toggleTheme()" aria-label="Toggle theme">◐</button>
      </header>
      ${isAuth ? body : `<main>${body}</main>`}
    `;
  }

  if (window.lucide && typeof lucide.createIcons === 'function') {
    try { lucide.createIcons(); } catch (e) {}
  }

  if (f) {
    const q = $('#q');
    if (q) {
      q.focus();
      q.setSelectionRange(99, 99);
    }
  }
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('skillex_theme', next);
}

// Router Event Listener
addEventListener('hashchange', () => {
  const m = $('main');
  if (m) {
    m.innerHTML = '<div class="skel" style="height:30px;width:40%"></div><div class="skel" style="height:120px"></div><div class="skel" style="height:120px"></div>';
  }
  setTimeout(() => {
    draw();
    scrollTo(0, 0);
  }, 120);
});

// App Startup
(async function init() {
  if (theme) {
    document.documentElement.dataset.theme = theme;
  }
  const savedUser = localStorage.getItem('skillex_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      role = currentUser.role || 'student';
    } catch (e) {
      currentUser = null;
      role = 'guest';
    }
  } else {
    currentUser = null;
    role = 'guest';
  }
  await loadInitialData();
  draw();
})();

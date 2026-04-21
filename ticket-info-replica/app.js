const pageData = window.TICKET_PAGE_DATA;
const ticket = pageData.ticket;
const show = pageData.show;
const booth = pageData.booth;
const item = ticket.orderTicketItemInfoModelList[0];
const banner = booth?.[0]?.boothResources?.[0];
const editState = getInitialEditState();

const assets = {
  poster: "./assets/poster.jpg",
  ticketBack: "./assets/ticket-back.png",
  credential: "./assets/wallet_only_credent.png",
  banner: "./assets/ticket-wallet-banner.png",
  service: "./assets/service.png",
  poi: "./assets/white-poi.png",
  details: [
    "./assets/detail-01.png",
    "./assets/detail-02.png",
    "./assets/detail-03.png",
    "./assets/detail-04.png",
    "./assets/detail-05.png",
    "./assets/detail-06.png",
    "./assets/detail-07.png",
    "./assets/detail-08.png",
    "./assets/detail-09.png",
  ],
};

const idTypeText = {
  ID_CARD: "居民身份证",
  PASSPORT: "护照",
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function normalizeDate(value, fallback = "2026-04-22") {
  const raw = String(value || "").trim();
  const full = raw.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (full) return `${full[1]}-${pad2(full[2])}-${pad2(full[3])}`;

  const short = raw.match(/^(\d{2})年(\d{1,2})月(\d{1,2})日?$/);
  if (short) return `20${short[1]}-${pad2(short[2])}-${pad2(short[3])}`;

  const monthDay = raw.match(/^(\d{1,2})月(\d{1,2})日?$/);
  if (monthDay) return `${fallback.slice(0, 4)}-${pad2(monthDay[1])}-${pad2(monthDay[2])}`;

  return fallback;
}

function normalizeTime(value, fallback = "20:00") {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{1,2})(?::|：|点|时)?(\d{1,2})?/);
  if (!match) return fallback;
  return `${pad2(match[1])}:${pad2(match[2] || "00")}`;
}

function shortSessionDate(date) {
  const [year, month, day] = normalizeDate(date).split("-");
  return `${year.slice(-2)}年${Number(month)}月${Number(day)}日`;
}

function getInitialEditState() {
  const identityNo = String(item.identityNo || "");
  const idMatch = identityNo.match(/^(\d{6})\*+(\d{4})$/);
  const beginTime = String(item.sessionBeginTime || "");
  const fallbackDate = beginTime.slice(0, 10) || "2026-04-22";
  const fallbackTime = beginTime.slice(11, 16) || "20:00";
  const opponentMatch = String(item.sessionName || "").match(/上海申花VS(.+)$/);
  const seatMatch = String(item.seatDesc || "").trim().match(/^(.+?)层看台\s+(.+?)台(.+?)层\s+(.+?)排(.+?)座$/);
  const zoneMatch = String(item.zoneName || "").trim().match(/^(.+?)层看台\s+(.+?)台(.+?)层$/);

  return {
    name: item.identityName || "",
    idFirst: idMatch?.[1] || identityNo.slice(0, 6),
    idLast: idMatch?.[2] || identityNo.slice(-4),
    date: normalizeDate(fallbackDate),
    time: normalizeTime(fallbackTime),
    opponent: opponentMatch?.[1] || "",
    stand: seatMatch?.[2] || zoneMatch?.[2] || "",
    level: seatMatch?.[1] || zoneMatch?.[1] || "",
    row: seatMatch?.[4] || "",
    seat: seatMatch?.[5] || "",
  };
}

function buildBeginTime() {
  return `${editState.date} ${editState.time}:00`;
}

function buildSessionName() {
  return `${shortSessionDate(editState.date)} ${editState.time}上海申花VS${editState.opponent}`;
}

function buildZoneName() {
  return `${editState.level}层看台 ${editState.stand}台${editState.level}层`;
}

function buildSeatDesc() {
  return `${buildZoneName()} ${editState.row}排${editState.seat}座`;
}

function applyEditState() {
  editState.date = normalizeDate(editState.date, editState.date);
  editState.time = normalizeTime(editState.time, editState.time);
  item.identityName = editState.name;
  item.identityNo = `${editState.idFirst}********${editState.idLast}`;
  item.sessionBeginTime = buildBeginTime();
  item.sessionName = buildSessionName();
  item.zoneName = buildZoneName();
  item.seatDesc = buildSeatDesc();
  ticket.sessionName = item.sessionName;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function noticeText(html) {
  return html
    .replaceAll("<p><br>", "<p>")
    .replaceAll("<br>", "")
    .trim();
}

function detailImages(html) {
  const remoteImages = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)];
  return remoteImages.map((match, index) => {
    const src = assets.details[index] || match[1].replaceAll("&amp;", "&");
    return `<img src="${src}" alt="">`;
  }).join("");
}

function renderPage() {
  const root = document.getElementById("ticket-page");
  root.innerHTML = `
    <img class="ticket-wallet-bg" src="${assets.ticketBack}" alt="">

    <section class="ticket-section">
      <span class="pot pot-left"></span>
      <span class="pot pot-right"></span>

      <header class="ticket-section-header">
        <div class="header-inner">
          <div class="show-row">
            <img class="ticket-cover" src="${assets.poster}" alt="${escapeHtml(ticket.showName)}">
            <div class="ticket-content">
              <h1>${escapeHtml(ticket.showName)}</h1>
            </div>
          </div>
        </div>
      </header>

      <section class="ticket-section-content">
        <div class="content-inner">
          <div class="content-header">
            <div class="user-info">
              <strong>${escapeHtml(item.identityName)}</strong>
              <span>${idTypeText[item.identityType] || item.identityType} ${escapeHtml(item.identityNo)}</span>
            </div>
            <div class="item-index"><b>1</b>/1张</div>
          </div>

          <div class="offline-session">
            <div><span>场次名称</span><em>${escapeHtml(item.sessionName)}</em></div>
            <div><span>开始时间</span><em>${escapeHtml(item.sessionBeginTime)}</em></div>
          </div>

          <div class="swiper-header">
            <strong>${escapeHtml(ticket.ticketTip)}</strong>
          </div>

          <div class="credential-wrap">
            <div class="credential-card" aria-label="身份证入场凭证"></div>
          </div>

          <div class="ticket-footer">
            <div class="entrance">${item.entrance?.length ? `入场口:${escapeHtml(item.entrance.map((gate) => gate.entranceName).join("、"))}` : ""}</div>
            <strong>${escapeHtml(item.seatDesc.trim())}</strong>
          </div>

          <div class="warm-tip">温馨提示:建议截屏保存座位号</div>
        </div>

        <div class="locate-box">
          <div class="address-line">
            <strong>${escapeHtml(ticket.address)}</strong>
          </div>
          <div class="locate-actions">
            <a href="tel:${ticket.phone}" aria-label="联系客服">
              <img src="${assets.service}" alt="">
              <span>客服</span>
            </a>
            <button type="button" aria-label="路线">
              <i class="route-icon"></i>
              <span>路线</span>
            </button>
          </div>
        </div>
      </section>
    </section>

    <footer class="btn-group">
      <button type="button" data-open="notice">使用须知</button>
      <button type="button" data-open="order">订单信息</button>
    </footer>

    ${banner ? `<section class="adv"><img src="${assets.banner}" alt="${escapeHtml(banner.name)}"></section>` : ""}

    <dialog class="sheet" id="notice-sheet">
      <div class="sheet-panel">
        <header>
          <strong>使用须知</strong>
          <button type="button" data-close aria-label="关闭">×</button>
        </header>
        <div class="sheet-tabs">
          <button class="active" type="button" data-tab="watch">观赛须知</button>
          <button type="button" data-tab="service">购票须知</button>
          <button type="button" data-tab="detail">赛事详情</button>
        </div>
        <article class="sheet-body" id="sheet-body"></article>
      </div>
    </dialog>

    <dialog class="sheet" id="order-sheet">
      <div class="sheet-panel small">
        <header>
          <strong>订单信息</strong>
          <button type="button" data-close aria-label="关闭">×</button>
        </header>
        <dl class="order-list">
          <div><dt>订单号</dt><dd>${escapeHtml(item.orderNo)}</dd></div>
          <div><dt>票号</dt><dd>${escapeHtml(item.ticketNo)}</dd></div>
          <div><dt>票档</dt><dd>${escapeHtml(item.priceName)}档</dd></div>
          <div><dt>价格</dt><dd>￥${(item.price / 100).toFixed(2)}</dd></div>
        </dl>
      </div>
    </dialog>

    <dialog class="sheet" id="edit-sheet">
      <div class="sheet-panel small">
        <header>
          <strong>修改信息</strong>
          <button type="button" data-close aria-label="关闭">×</button>
        </header>
        <form class="edit-form" id="edit-form">
          <label>
            姓名
            <input name="name" value="${escapeHtml(editState.name)}" autocomplete="off">
          </label>
          <label>
            身份证前6位
            <input name="idFirst" value="${escapeHtml(editState.idFirst)}" inputmode="numeric" maxlength="6" autocomplete="off">
          </label>
          <label>
            身份证后4位
            <input name="idLast" value="${escapeHtml(editState.idLast)}" inputmode="numeric" maxlength="4" autocomplete="off">
          </label>
          <label>
            场次日期
            <input name="date" value="${escapeHtml(editState.date)}" placeholder="2026-04-22" autocomplete="off">
          </label>
          <label>
            时间
            <input name="time" value="${escapeHtml(editState.time)}" placeholder="20:00" autocomplete="off">
          </label>
          <label class="wide">
            上海申花VS的对手
            <input name="opponent" value="${escapeHtml(editState.opponent)}" autocomplete="off">
          </label>
          <label>
            几号看台
            <input name="stand" value="${escapeHtml(editState.stand)}" inputmode="numeric" autocomplete="off">
          </label>
          <label>
            几层看台
            <input name="level" value="${escapeHtml(editState.level)}" inputmode="numeric" autocomplete="off">
          </label>
          <label>
            排号
            <input name="row" value="${escapeHtml(editState.row)}" inputmode="numeric" autocomplete="off">
          </label>
          <label>
            座号
            <input name="seat" value="${escapeHtml(editState.seat)}" inputmode="numeric" autocomplete="off">
          </label>
          <div class="edit-actions">
            <button type="button" data-close>取消</button>
            <button type="submit">保存</button>
          </div>
        </form>
      </div>
    </dialog>
  `;

  bindSheets();
  setNoticeTab("watch");
}

function bindSheets() {
  const editTrigger = document.querySelector(".edit-trigger");
  if (editTrigger) {
    editTrigger.onclick = () => document.getElementById("edit-sheet")?.showModal();
  }

  document.querySelector('[data-open="notice"]').addEventListener("click", () => {
    document.getElementById("notice-sheet").showModal();
  });
  document.querySelector('[data-open="order"]').addEventListener("click", () => {
    document.getElementById("order-sheet").showModal();
  });
  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => setNoticeTab(button.dataset.tab));
  });
  document.getElementById("edit-form").addEventListener("submit", handleEditSubmit);
}

function handleEditSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  [
    "name",
    "idFirst",
    "idLast",
    "date",
    "time",
    "opponent",
    "stand",
    "level",
    "row",
    "seat",
  ].forEach((key) => {
    editState[key] = String(formData.get(key) || "").trim();
  });
  applyEditState();
  renderPage();
}

function setNoticeTab(tab) {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  const body = document.getElementById("sheet-body");
  body.classList.toggle("detail-images", tab === "detail");
  if (tab === "watch") body.innerHTML = noticeText(ticket.watchNotice);
  if (tab === "service") body.innerHTML = noticeText(ticket.serviceNotice);
  if (tab === "detail") body.innerHTML = detailImages(show.showDetail);
}

renderPage();

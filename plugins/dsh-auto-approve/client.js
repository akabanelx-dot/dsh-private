/**
 * dsh-auto-approve — 浏览器半边（/plugins/auto-approve/client.js）。
 *
 * 以 classic script 加载，通过 window.__ModuleLoader__.load 注册 CJS factory。
 * 纯 DOM 实现（无 React）：注入侧边栏「自动批准」入口 + 右侧抽屉面板，
 * 面板通过 /api/dsh-auto-approve 查看审计记录并编辑配置。
 */
window.__ModuleLoader__.load({
  id: 'dsh-auto-approve',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    var name = 'auto-approve'
    var inject = []
    var API_BASE = '/api/dsh-auto-approve'

    // -----------------------------------------------------------------------
    // 状态
    // -----------------------------------------------------------------------
    var open = false
    var config = null
    var records = []

    // -----------------------------------------------------------------------
    // 样式
    // -----------------------------------------------------------------------
    var CSS = [
      '[data-daa-entry]{display:flex;align-items:center;gap:8px;width:100%;border:none;background:transparent;color:inherit;padding:8px 10px;border-radius:6px;cursor:pointer;font-size:13px;text-align:left}',
      '[data-daa-entry]:hover{background:rgba(127,127,127,.14)}',
      '[data-daa-entry][data-active=true]{background:rgba(127,127,127,.22)}',
      '[data-daa-drawer]{position:fixed;top:0;right:0;width:400px;max-width:90vw;height:100vh;z-index:9999;display:flex;flex-direction:column;background:#1b1d23;color:#e6e6e6;border-left:1px solid rgba(255,255,255,.08);box-shadow:-8px 0 24px rgba(0,0,0,.35);transform:translateX(100%);transition:transform .18s ease;font-size:13px}',
      '[data-daa-drawer][data-open=true]{transform:translateX(0)}',
      '[data-daa-head]{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}',
      '[data-daa-head] b{font-size:14px}',
      '[data-daa-body]{flex:1;overflow-y:auto;padding:12px 14px}',
      '[data-daa-section]{margin-bottom:16px}',
      '[data-daa-section]>h3{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#9aa0a6;margin:0 0 8px}',
      '[data-daa-row]{display:flex;gap:8px;align-items:center;margin-bottom:8px}',
      '[data-daa-row] label{flex:0 0 140px;color:#c6cbd0}',
      '[data-daa-row] input[type=text]{flex:1;background:#121317;border:1px solid rgba(255,255,255,.12);border-radius:5px;color:inherit;padding:5px 8px;font-size:12px}',
      '[data-daa-row] input[type=number]{width:90px;background:#121317;border:1px solid rgba(255,255,255,.12);border-radius:5px;color:inherit;padding:5px 8px;font-size:12px}',
      '[data-daa-row] select{background:#121317;border:1px solid rgba(255,255,255,.12);border-radius:5px;color:inherit;padding:5px 8px;font-size:12px}',
      '[data-daa-hint]{font-size:11px;color:#7a8087;margin:-4px 0 10px 148px}',
      '[data-daa-btn]{background:#2a6ef0;color:#fff;border:none;border-radius:5px;padding:6px 12px;cursor:pointer;font-size:12px}',
      '[data-daa-btn]:hover{filter:brightness(1.1)}',
      '[data-daa-btn].ghost{background:transparent;border:1px solid rgba(255,255,255,.2);color:#c6cbd0}',
      '[data-daa-rec]{border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:9px 10px;margin-bottom:8px;background:#14161b}',
      '[data-daa-meta]{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:5px;font-size:11px;color:#9aa0a6}',
      '[data-daa-badge]{padding:1px 7px;border-radius:9px;font-size:10px;font-weight:600;text-transform:uppercase}',
      '[data-daa-badge].allow{background:rgba(52,168,83,.18);color:#5cd685}',
      '[data-daa-badge].delegated{background:rgba(251,188,4,.16);color:#fdd663}',
      '[data-daa-badge].cancelled{background:rgba(154,160,166,.16);color:#c6cbd0}',
      '[data-daa-badge].flip{background:rgba(42,110,240,.18);color:#8ab4f8}',
      '[data-daa-reason]{font-size:12px;color:#d8dce0;word-break:break-word}',
      '[data-daa-empty]{color:#7a8087;font-style:italic;padding:20px 0;text-align:center}',
      '[data-daa-close]{background:transparent;border:none;color:#9aa0a6;font-size:18px;cursor:pointer;line-height:1}',
    ].join('\n')

    function injectCss() {
      if (document.querySelector('style[data-daa-css]')) return
      var style = document.createElement('style')
      style.setAttribute('data-daa-css', '')
      style.textContent = CSS
      document.head.appendChild(style)
    }

    // -----------------------------------------------------------------------
    // API
    // -----------------------------------------------------------------------
    async function fetchJson(path, options) {
      var response = await fetch(API_BASE + path, options)
      var body = null
      try { body = await response.json() } catch { /* ignore */ }
      if (!response.ok) {
        var message = body && body.error ? body.error : ('HTTP ' + response.status)
        throw new Error(message)
      }
      return body
    }

    async function loadAudit() {
      var body = await fetchJson('/audit')
      records = body.records || []
      renderAudit()
    }

    async function loadConfig() {
      var body = await fetchJson('/config')
      config = body.config || {}
      renderConfig()
    }

    async function saveConfig() {
      var body = await fetchJson('/config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(config),
      })
      config = body.config || config
      renderConfig()
    }

    async function clearAudit() {
      await fetchJson('/audit', { method: 'DELETE' })
      records = []
      renderAudit()
    }

    // -----------------------------------------------------------------------
    // DOM 工具
    // -----------------------------------------------------------------------
    function el(tag, attrs, children) {
      var node = document.createElement(tag)
      if (attrs) {
        for (var key in attrs) {
          if (key === 'text') node.textContent = attrs[key]
          else if (key === 'html') node.innerHTML = attrs[key]
          else if (key.startsWith('on') && typeof attrs[key] === 'function') node.addEventListener(key.slice(2), attrs[key])
          else if (key === 'dataset') Object.assign(node.dataset, attrs[key])
          else node.setAttribute(key, attrs[key])
        }
      }
      ;(children || []).forEach(function (child) {
        if (child === null || child === undefined) return
        node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child)
      })
      return node
    }

    function sidebarRoot() {
      var column = document.querySelector('[data-pane="sidebar"], [class*="sidebarCol"]')
      if (!column) return undefined
      var logoOwner = column.querySelector('[class*="logoRow"]')?.parentElement
      return logoOwner ?? (column.firstElementChild || undefined)
    }

    function newSessionButton(root) {
      var nested = root.querySelector('button[class*="newSession"]')
      if (nested) return nested
      for (var i = 0; i < root.children.length; i++) {
        if (root.children[i].tagName === 'BUTTON') return root.children[i]
      }
      return undefined
    }

    function createEntry() {
      var entry = el('button', { 'data-daa-entry': '', title: '自动批准（帮我批准模式：检测到的风险操作自动批准）' }, [
        el('span', { html: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 1.5l6 2.5v4.6c0 3.6-2.6 5.8-6 6.9-3.4-1.1-6-3.3-6-6.9V4z"/><path d="M5 8.1l1.9 1.9L11 6"/></svg>' }),
        el('span', { text: '自动批准' }),
      ])
      entry.addEventListener('click', function () { toggle() })
      return entry
    }

    function placeEntry(root, entry) {
      var button = newSessionButton(root)
      if (!button) return false
      if (entry.parentElement !== root) {
        var row = button.closest('[class*="logoRow"]')
        var base = row && row.parentElement === root ? row : button
        var family = Array.prototype.filter.call(root.children, function (node) {
          return node instanceof HTMLElement && (node.matches('[data-dsh-taskboard-entry],[data-dsh-ssh-entry],[data-dpr-entry],[data-daa-entry]'))
        })
        var anchor = family.length > 0 ? family[family.length - 1].nextElementSibling : base.nextElementSibling
        root.insertBefore(entry, anchor)
      }
      return true
    }

    function mountEntry() {
      var entry = createEntry()
      var root
      var placed = false
      var rootObserver
      function tryPlace() {
        if (root && !root.isConnected) { rootObserver.disconnect(); root = undefined; placed = false }
        if (placed) {
          if (document.body.contains(entry)) return
          rootObserver.disconnect(); root = undefined; placed = false
        }
        if (!root) root = sidebarRoot()
        if (!root) return
        placed = placeEntry(root, entry)
        if (placed) rootObserver.observe(root, { childList: true, subtree: true })
      }
      var waitObserver = new MutationObserver(tryPlace)
      waitObserver.observe(document.body, { childList: true, subtree: true })
      rootObserver = new MutationObserver(function () {
        if (!root || !root.isConnected) { placed = false; tryPlace(); return }
        if (!root.contains(entry)) placed = placeEntry(root, entry)
      })
      function reflect() { entry.dataset.active = open ? 'true' : undefined }
      reflect()
      tryPlace()
      return function dispose() {
        waitObserver.disconnect()
        rootObserver.disconnect()
        entry.remove()
      }
    }

    // -----------------------------------------------------------------------
    // 抽屉面板
    // -----------------------------------------------------------------------
    var drawer

    function outcomeClass(outcome) {
      if (outcome === 'allowed-once') return 'allow'
      if (outcome === 'cancelled') return 'cancelled'
      if (outcome === 'flipped-policy') return 'flip'
      return 'delegated'
    }

    function outcomeLabel(outcome) {
      if (outcome === 'allowed-once') return '放行'
      if (outcome === 'cancelled') return '取消'
      if (outcome === 'flipped-policy') return '策略接管'
      return '未接管'
    }

    function formatTime(at) {
      try { return new Date(at).toLocaleString() } catch { return String(at) }
    }

    function renderAudit() {
      var list = drawer.querySelector('[data-daa-audit]')
      if (!list) return
      list.textContent = ''
      if (!records.length) {
        list.appendChild(el('div', { 'data-daa-empty': '', text: '暂无审计记录' }))
        return
      }
      records.forEach(function (rec) {
        var cls = outcomeClass(rec.outcome)
        var badge = el('span', { 'data-daa-badge': '', class: cls, text: outcomeLabel(rec.outcome) })
        var meta = el('div', { 'data-daa-meta': '' }, [
          el('span', { text: formatTime(rec.at) }),
          el('span', { text: rec.toolName ? ('工具 ' + rec.toolName) : '' }),
          rec.requestedMode ? el('span', { text: '→ ' + rec.requestedMode }) : null,
          badge,
        ])
        var reason = el('div', { 'data-daa-reason': '' }, [
          rec.justification ? el('div', { text: '理由：' + rec.justification }) : null,
          rec.reasoning ? el('div', { text: '说明：' + rec.reasoning }) : null,
        ])
        list.appendChild(el('div', { 'data-daa-rec': '' }, [meta, reason]))
      })
    }

    function renderConfig() {
      var cfg = config || {}
      var body = drawer.querySelector('[data-daa-config]')
      if (!body) return
      body.textContent = ''

      var enabledRow = el('div', { 'data-daa-row': '' }, [
        el('label', { text: '启用插件' }),
        inputCheckbox(cfg.enabled, function (v) { cfg.enabled = v }),
      ])
      var modeRow = el('div', { 'data-daa-row': '' }, [
        el('label', { text: '模式' }),
        inputSelect(['approve', 'audit'], cfg.mode, { approve: '自动批准（帮我批准）', audit: '仅审计（不接管）' }, function (v) { cfg.mode = v }),
      ])
      var overrideRow = el('div', { 'data-daa-row': '' }, [
        el('label', { text: '接管 never 策略' }),
        inputCheckbox(cfg.overrideNeverPolicy, function (v) { cfg.overrideNeverPolicy = v }),
      ])
      var overrideHint = el('div', { 'data-daa-hint': '', text: '会话策略为 never 时接管为 ask，再自动批准提权；关闭则 never 下直接拒绝' })
      var allowedRow = el('div', { 'data-daa-row': '' }, [
        el('label', { text: '允许的目标模式' }),
        inputText((cfg.allowedModes || []).join(', '), function (v) { cfg.allowedModes = v }, 'workspace-write, danger-full-access（* 表示全部）'),
      ])
      var denyRow = el('div', { 'data-daa-row': '' }, [
        el('label', { text: '拒绝工具' }),
        inputText((cfg.denyTools || []).join(', '), function (v) { cfg.denyTools = v }, '逗号分隔，留空不拒绝任何工具'),
      ])
      var maxRow = el('div', { 'data-daa-row': '' }, [
        el('label', { text: '审计记录上限' }),
        inputNumber(cfg.maxRecords, function (v) { cfg.maxRecords = v }),
      ])
      var saveBtn = el('button', { 'data-daa-btn': '', text: '保存配置' })
      saveBtn.addEventListener('click', function () { saveConfig().catch(function (e) { alert('保存失败：' + e.message) }) })

      body.appendChild(enabledRow)
      body.appendChild(modeRow)
      body.appendChild(overrideRow)
      body.appendChild(overrideHint)
      body.appendChild(allowedRow)
      body.appendChild(denyRow)
      body.appendChild(maxRow)
      body.appendChild(saveBtn)
    }

    function inputCheckbox(value, onchange) {
      var node = el('input', { type: 'checkbox' })
      node.checked = !!value
      node.addEventListener('change', function () { onchange(node.checked) })
      return node
    }

    function inputSelect(options, value, labels, onchange) {
      var node = el('select', {})
      options.forEach(function (opt) {
        var o = el('option', { value: opt, text: labels[opt] || opt })
        if (opt === value) o.selected = true
        node.appendChild(o)
      })
      node.addEventListener('change', function () { onchange(node.value) })
      return node
    }

    function inputText(value, onchange, placeholder) {
      var node = el('input', { type: 'text' })
      node.value = value || ''
      if (placeholder) node.placeholder = placeholder
      node.addEventListener('input', function () { onchange(node.value) })
      return node
    }

    function inputNumber(value, onchange) {
      var node = el('input', { type: 'number', min: '1' })
      node.value = value || 500
      node.addEventListener('change', function () { onchange(Number(node.value) || 500) })
      return node
    }

    function buildDrawer() {
      var header = el('div', { 'data-daa-head': '' }, [
        el('b', { text: '自动批准' }),
        el('button', { 'data-daa-close': '', text: '×' }),
      ])
      header.querySelector('[data-daa-close]').addEventListener('click', function () { setOpen(false) })

      var refresh = el('button', { 'data-daa-btn': '', class: 'ghost', text: '刷新' })
      refresh.addEventListener('click', function () { Promise.all([loadAudit(), loadConfig()]).catch(function (e) { alert('加载失败：' + e.message) }) })
      var clear = el('button', { 'data-daa-btn': '', class: 'ghost', text: '清空审计' })
      clear.addEventListener('click', function () { clearAudit().catch(function (e) { alert('清空失败：' + e.message) }) })

      var actions = el('div', { 'data-daa-row': '' }, [refresh, clear])

      var configSection = el('div', { 'data-daa-section': '' }, [
        el('h3', { text: '配置' }),
        el('div', { 'data-daa-config': '' }),
      ])
      var auditSection = el('div', { 'data-daa-section': '' }, [
        el('h3', { text: '审计记录' }),
        actions,
        el('div', { 'data-daa-audit': '' }),
      ])

      var body = el('div', { 'data-daa-body': '' }, [configSection, auditSection])
      return el('div', { 'data-daa-drawer': '' }, [header, body])
    }

    function mountPanel() {
      drawer = buildDrawer()
      document.body.appendChild(drawer)
      return function dispose() {
        drawer.remove()
        drawer = undefined
      }
    }

    function setOpen(value) {
      open = value
      if (drawer) drawer.dataset.open = open ? 'true' : undefined
      var entry = document.querySelector('[data-daa-entry]')
      if (entry) entry.dataset.active = open ? 'true' : undefined
      if (open && config === null) {
        Promise.all([loadAudit(), loadConfig()]).catch(function () { /* 面板加载失败不致命 */ })
      }
    }

    function toggle() {
      setOpen(!open)
    }

    // -----------------------------------------------------------------------
    // 插件入口
    // -----------------------------------------------------------------------
    function apply(ctx) {
      injectCss()
      var disposers = []
      try {
        disposers.push(mountEntry())
        disposers.push(mountPanel())
      } catch (error) {
        console.warn('[dsh-auto-approve] mount failed:', error)
      }
      ctx.effect(function () {
        return function () { disposers.splice(0).forEach(function (d) { d() }) }
      }, 'auto-approve: ui')
    }

    exports.apply = apply
    exports.inject = inject
    exports.name = name
    return module.exports
  },
})

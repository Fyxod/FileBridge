(() => {
  const suggestionData = window.FileBridgeSuggestions || {};
  const inputs = Array.from(document.querySelectorAll("input[data-suggest]"));
  const userCache = new Map();

  if (!inputs.length) {
    return;
  }

  function normalize(value) {
    return value.trim().toLowerCase();
  }

  function filterList(list, query) {
    const normalized = normalize(query);
    if (!normalized) {
      return [];
    }
    return list
      .filter((item) => normalize(item).includes(normalized))
      .slice(0, 8);
  }

  function splitMulti(value) {
    const parts = value.split(",");
    const prefix = parts.slice(0, -1).join(",").trim();
    const current = parts[parts.length - 1].trim();
    return { prefix, current };
  }

  function buildValue(prefix, selection, isMulti) {
    if (!isMulti) {
      return selection;
    }
    if (!prefix) {
      return selection;
    }
    return `${prefix}, ${selection}`;
  }

  function createBox() {
    const box = document.createElement("div");
    box.className = "suggestion-box";
    box.setAttribute("role", "listbox");
    document.body.appendChild(box);
    return box;
  }

  function positionBox(box, input) {
    const rect = input.getBoundingClientRect();
    box.style.left = `${rect.left + window.scrollX}px`;
    box.style.top = `${rect.bottom + window.scrollY + 6}px`;
    box.style.width = `${rect.width}px`;
  }

  async function fetchUsers(query) {
    const normalized = normalize(query);
    if (!normalized) {
      return [];
    }
    if (userCache.has(normalized)) {
      return userCache.get(normalized);
    }
    const response = await fetch(
      `/users/search?userId=${encodeURIComponent(query)}`,
    );
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    const results = (data.results || []).map((user) => user.userId);
    userCache.set(normalized, results);
    return results;
  }

  function attachInput(input) {
    const source = input.getAttribute("data-suggest");
    const isMulti = input.hasAttribute("data-suggest-multi");
    const box = createBox();
    let items = [];
    let activeIndex = -1;
    let currentPrefix = "";
    let debounceTimer = null;
    let requestCounter = 0;

    input.setAttribute("autocomplete", "off");

    function hideBox() {
      box.style.display = "none";
      box.innerHTML = "";
      items = [];
      activeIndex = -1;
    }

    function showBox() {
      if (!items.length) {
        hideBox();
        return;
      }
      positionBox(box, input);
      box.style.display = "block";
    }

    function renderBox() {
      box.innerHTML = "";
      items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "suggestion-item";
        row.textContent = item;
        row.setAttribute("role", "option");
        if (index === activeIndex) {
          row.classList.add("is-active");
        }
        row.addEventListener("mousedown", (event) => {
          event.preventDefault();
          selectItem(index);
        });
        box.appendChild(row);
      });
      showBox();
    }

    function selectItem(index) {
      if (index < 0 || index >= items.length) {
        return;
      }
      const value = buildValue(currentPrefix, items[index], isMulti);
      input.value = value;
      hideBox();
      input.focus();
    }

    async function updateSuggestions() {
      const value = input.value || "";
      const { prefix, current } = isMulti
        ? splitMulti(value)
        : { prefix: "", current: value.trim() };
      currentPrefix = prefix;

      if (!current) {
        hideBox();
        return;
      }

      if (source === "users") {
        const requestId = ++requestCounter;
        const results = await fetchUsers(current);
        if (requestId !== requestCounter) {
          return;
        }
        items = filterList(results, current);
      } else {
        const list = Array.isArray(suggestionData[source])
          ? suggestionData[source]
          : [];
        items = filterList(list, current);
      }

      activeIndex = items.length ? 0 : -1;
      renderBox();
    }

    function scheduleUpdate() {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(updateSuggestions, 140);
    }

    function handleKeydown(event) {
      if (!items.length || box.style.display !== "block") {
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        renderBox();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        renderBox();
      } else if (event.key === "Enter") {
        if (activeIndex >= 0) {
          event.preventDefault();
          selectItem(activeIndex);
        }
      } else if (event.key === "Escape") {
        hideBox();
      }
    }

    function handleBlur() {
      window.setTimeout(() => {
        hideBox();
      }, 120);
    }

    function handleViewportChange() {
      if (box.style.display === "block") {
        positionBox(box, input);
      }
    }

    input.addEventListener("input", scheduleUpdate);
    input.addEventListener("focus", scheduleUpdate);
    input.addEventListener("keydown", handleKeydown);
    input.addEventListener("blur", handleBlur);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
  }

  inputs.forEach(attachInput);
})();

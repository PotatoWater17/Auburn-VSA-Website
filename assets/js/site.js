// Public site: nav, FAQ accordion, newsletter, and CMS content hydration.
// After editing this file, run: php tools/bump-assets.php --bump
(function () {
  /**
   * App mount path when the site is not at the domain root
   * (e.g. "/~vsa" or "/studentorgs/vsa"). Derived from where site.js was
   * loaded so university subdirectory hosting works without a rebuild.
   * Override with window.VSA_BASE = "/your/path" before this script if needed.
   */
  function appBasePath() {
    if (typeof window.VSA_BASE === "string") {
      return String(window.VSA_BASE).replace(/\/$/, "");
    }
    var el = document.querySelector('script[src*="assets/js/site.js"]');
    if (!el) return "";
    try {
      var abs = new URL(el.getAttribute("src") || "", location.href);
      var path = abs.pathname.replace(/\/assets\/js\/site\.js$/i, "");
      if (!path || path === "/") return "";
      return path.replace(/\/$/, "");
    } catch (e) {
      return "";
    }
  }

  /** Prefix a site-root path ("/api/…", "/events", "/") with the app base. */
  function appUrl(path) {
    path = String(path == null ? "" : path);
    if (/^(https?:)?\/\//i.test(path) || path.charAt(0) === "#") return path;
    var base = appBasePath();
    if (!path || path === "/") return base ? base + "/" : "/";
    if (path.charAt(0) !== "/") path = "/" + path;
    return base + path;
  }

  var SOCIAL_PATHS = {
    x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    instagram:
      "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38A5.86 5.86 0 0 0 .63 4.14c-.3.76-.5 1.64-.56 2.9C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.86 5.86 0 0 0 2.12-1.38 5.86 5.86 0 0 0 1.38-2.12c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.12A5.86 5.86 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0m0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84M12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4m6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44",
    facebook:
      "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.68 4.53-4.68 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.24h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07",
    youtube:
      "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81M9.6 15.6V8.4l6.24 3.6z",
    linkedin:
      "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14M7.12 20.45H3.55V9h3.57zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0",
    discord:
      "M20.32 4.37A19.8 19.8 0 0 0 15.4 2.9a.07.07 0 0 0-.08.03c-.21.38-.44.87-.61 1.25a18.3 18.3 0 0 0-5.42 0 12 12 0 0 0-.62-1.25.08.08 0 0 0-.08-.03c-1.72.3-3.37.8-4.92 1.47a.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 6.03 3.05.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11c-.65-.25-1.27-.55-1.87-.89a.08.08 0 0 1-.01-.13l.37-.29a.07.07 0 0 1 .08-.01 14.2 14.2 0 0 0 12.06 0 .07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.11c.36.7.78 1.36 1.23 1.99a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6.03-3.05.08.08 0 0 0 .03-.05c.5-5.18-.84-9.67-3.54-13.66a.06.06 0 0 0-.03-.03M8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42m7.97 0c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42",
    tiktok:
      "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .59.05.86.13V9.4a6.33 6.33 0 0 0-1-.05A6.34 6.34 0 0 0 5.6 20.87a6.34 6.34 0 0 0 10.66-4.65V8.86a8.16 8.16 0 0 0 4.77 1.53V6.94a4.85 4.85 0 0 1-1.44-.25",
    snapchat:
      "M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z",
    threads:
      "M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z",
    whatsapp:
      "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
    telegram:
      "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
    reddit:
      "M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z",
    pinterest:
      "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z",
    twitch:
      "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z",
    spotify:
      "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z",
    github:
      "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
    linktree:
      "m13.73635 5.85251 4.00467-4.11665 2.3248 2.3808-4.20064 4.00466h5.9085v3.30473h-5.9365l4.22865 4.10766-2.3248 2.3338L12.0005 12.099l-5.74052 5.76852-2.3248-2.3248 4.22864-4.10766h-5.9375V8.12132h5.9085L3.93417 4.11666l2.3248-2.3808 4.00468 4.11665V0h3.4727zm-3.4727 10.30614h3.4727V24h-3.4727z",
    email:
      "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
    link:
      "M18.364 15.536L16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414zm-2.828 2.829l-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414zm-.708-10.607l1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07z",
  };

  function phoneDigits(value) {
    return String(value == null ? "" : value).replace(/\D/g, "");
  }

  function formatUsPhoneDisplay(value) {
    var d = phoneDigits(value);
    if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
    if (!d) return "";
    if (d.length < 4) return d;
    if (d.length < 7) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6, 10);
  }

  function telHrefFromPhone(value) {
    var raw = String(value == null ? "" : value).trim();
    if (!raw) return "";
    var d = phoneDigits(raw);
    if (!d) return "";
    if (raw.charAt(0) === "+") return "+" + d;
    if (d.length === 11 && d.charAt(0) === "1") return "+1" + d.slice(1);
    if (d.length === 10) return "+1" + d;
    return "+" + d;
  }

  function displayPhone(value, customFormat) {
    var raw = String(value == null ? "" : value).trim();
    if (!raw) return "";
    if (customFormat === "yes" || customFormat === true) return raw;
    var formatted = formatUsPhoneDisplay(raw);
    return formatted || raw;
  }

  /** CMS items with visible=no stay in content.json but are omitted on the public site. */
  function isContentVisible(item) {
    if (!item || typeof item !== "object") return true;
    var v = item.visible;
    if (v === false || v === 0 || v === "0") return false;
    if (typeof v === "string") {
      var s = v.trim().toLowerCase();
      if (s === "no" || s === "off" || s === "hidden" || s === "false") return false;
    }
    return true;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc && acc[key] != null ? acc[key] : "";
    }, obj);
  }

  function placeholder(src, label, classes, variant, alt, opts) {
    classes = classes || "";
    opts = opts || {};
    src = src ? safeMediaUrl(src) : "";
    if (src) {
      var loading = opts.eager ? "eager" : "lazy";
      var prio = opts.eager ? ' fetchpriority="high"' : "";
      var dims = "";
      if (opts.width && opts.height) {
        dims = ' width="' + opts.width + '" height="' + opts.height + '"';
      } else if (/\bratio-16x6\b/.test(classes)) {
        dims = ' width="1600" height="600"';
      } else if (/\bratio-16x9\b/.test(classes)) {
        dims = ' width="1600" height="900"';
      } else if (/\bratio-4x3\b/.test(classes)) {
        dims = ' width="1200" height="900"';
      } else if (/\bratio-1x1\b/.test(classes)) {
        dims = ' width="800" height="800"';
      }
      return (
        '<img src="' +
        escapeHtml(src) +
        '" alt="' +
        escapeHtml(alt || "") +
        '" class="ph-img ' +
        escapeHtml(classes) +
        '" loading="' +
        loading +
        '" decoding="async" draggable="false"' +
        prio +
        dims +
        ">"
      );
    }
    var bg = variant === "orange" ? "ph-orange" : "ph-navy";
    var inner = label ? "<span>" + escapeHtml(label) + "</span>" : "";
    return '<div class="placeholder ' + bg + " " + escapeHtml(classes) + '">' + inner + "</div>";
  }

  function socialIcon(icon) {
    if (icon === "auinvolve") {
      // Simple wordmark — reads as “AU Involve” without the busy campus logo art
      return (
        '<svg class="social-auinvolve" viewBox="0 0 52 24" fill="currentColor" aria-hidden="true">' +
        '<text x="1" y="11" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" letter-spacing="0.6">AU</text>' +
        '<text x="1" y="21" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="6.2" font-weight="700" letter-spacing="1.4">INVOLVE</text>' +
        "</svg>"
      );
    }
    var d = SOCIAL_PATHS[icon];
    if (!d) return "";
    return (
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' +
      d +
      '"></path></svg>'
    );
  }

  /** Custom uploaded icon — CSS mask so footer currentColor (white / orange hover) applies. */
  function socialCustomIcon(src) {
    var url = safeMediaUrl(src);
    if (!url) return "";
    var cssUrl = 'url("' + escapeHtml(url).replace(/\(/g, "%28").replace(/\)/g, "%29") + '")';
    return (
      '<span class="social-custom" aria-hidden="true" style="-webkit-mask-image:' +
      cssUrl +
      ";mask-image:" +
      cssUrl +
      '"></span>'
    );
  }

  function socialIconMarkup(s) {
    if (!s) return "";
    var custom = socialCustomIcon(s.image);
    if (custom) return custom;
    return socialIcon(s.icon);
  }

  function setText(sel, value) {
    var el = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (el) el.textContent = value == null ? "" : String(value);
  }

  /**
   * Paint a heading with navy/orange brand spans.
   * Use | in CMS text to mark segments, e.g. "About | Auburn VSA"
   * or "Why | Join VSA|?". Without |, the last word is orange.
   * opts.orangeFirst: flip so odd segments are navy (team page titles).
   * opts.highlightClass: class for odd (highlighted) segments (default text-orange).
   */
  function setBrandHeading(sel, value, fallback, opts) {
    var el = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!el) return;
    opts = opts || {};
    var text = String(value == null ? "" : value).trim();
    if (!text) text = String(fallback || "").trim();
    if (!text) {
      el.textContent = "";
      return;
    }
    var hl = opts.highlightClass || "text-orange";
    var base = opts.baseClass || "text-navy";
    if (opts.orangeFirst) {
      hl = opts.highlightClass || "text-orange";
      base = opts.baseClass || "text-navy";
    }
    function partClass(i) {
      if (opts.orangeFirst) return i % 2 === 0 ? hl : base;
      return i % 2 === 0 ? base : hl;
    }
    if (text.indexOf("|") !== -1) {
      var parts = text.split("|");
      el.innerHTML = parts
        .map(function (_p, i) {
          return '<span class="' + partClass(i) + '"></span>';
        })
        .join("");
      parts.forEach(function (part, i) {
        if (el.children[i]) el.children[i].textContent = part;
      });
      return;
    }
    var m = text.match(/^(.+\s)(\S+)$/);
    if (m) {
      el.innerHTML =
        '<span class="' +
        partClass(0) +
        '"></span><span class="' +
        partClass(1) +
        '"></span>';
      el.children[0].textContent = m[1];
      el.children[1].textContent = m[2];
      return;
    }
    el.textContent = text;
  }

  function setHtml(sel, html) {
    var el = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (el) el.innerHTML = html;
  }

  /** Block javascript:/data: and other unsafe schemes from CMS-driven links. */
  function safeUrl(href) {
    var url = href == null ? "" : String(href).trim();
    if (!url || url === "#") return "";
    try {
      url = decodeURIComponent(url);
    } catch (e) {
      /* keep raw */
    }
    url = url.replace(/[\u0000-\u001F\u007F]+/g, "").trim();
    if (!url || url === "#") return "";
    if (url.indexOf("..") !== -1) return "";
    var compact = url.toLowerCase().replace(/\s+/g, "");
    if (
      compact.indexOf("javascript:") === 0 ||
      compact.indexOf("data:") === 0 ||
      compact.indexOf("vbscript:") === 0 ||
      compact.indexOf("file:") === 0
    ) {
      return "";
    }
    return url;
  }

  /** Media paths for img/src/favicon — uploads/, absolute http(s), or root-relative. */
  function safeMediaUrl(src) {
    var url = safeUrl(src);
    if (!url) return "";
    if (/^uploads\/[A-Za-z0-9._/-]+$/.test(url)) return url;
    if (url.charAt(0) === "/" && url.charAt(1) !== "/") return url;
    if (/^https?:\/\//i.test(url)) return url;
    // Allow same-origin relative filenames used by the CMS (e.g. legacy paths).
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
    return "";
  }

  function setHref(sel, href, opts) {
    var el = document.querySelector(sel);
    if (!el) return;
    var url = safeUrl(href);
    var hideIfEmpty = !!(opts && opts.hideIfEmpty);
    if (url) {
      el.setAttribute("href", url);
      el.removeAttribute("aria-disabled");
      el.classList.remove("is-disabled-link");
      el.classList.remove("hidden");
      el.removeAttribute("hidden");
    } else {
      el.setAttribute("href", "#");
      el.setAttribute("aria-disabled", "true");
      el.classList.add("is-disabled-link");
      if (hideIfEmpty) {
        el.classList.add("hidden");
        el.setAttribute("hidden", "hidden");
      }
    }
  }

  function socialHref(content, icon) {
    var list = (content && content.socials) || [];
    for (var i = 0; i < list.length; i++) {
      var s = list[i] || {};
      if (!isContentVisible(s)) continue;
      if (String(s.icon || "").toLowerCase() === icon) {
        return safeUrl(s.href || "");
      }
    }
    return "";
  }

  var PAGE_SEO = {
    home: {
      // Keep brand first + short enough that Google’s SERP title rarely truncates mid-phrase.
      title: "Auburn VSA | Vietnamese Student Association",
      description:
        "Join Auburn VSA — open to every Auburn student. Meetings, ACE mentorship, cultural events, and Auburn Royale. Register free on AUinvolve.",
    },
    team: {
      title: null,
      description:
        "Meet Auburn VSA’s student leaders — executive board, tech team, and AU Royale directors at Auburn University.",
    },
    events: {
      title: "Events | Auburn VSA — Auburn University",
      description:
        "Upcoming Auburn VSA events, general body meetings, socials, and Auburn Royale at Auburn University. Dates, locations, and how to get involved.",
    },
    royale: {
      title: "Auburn Royale | Auburn VSA — Auburn University",
      description:
        "Auburn Royale — Auburn VSA’s annual cultural carnival with Vietnamese games, food, prizes, and performances at Auburn University.",
    },
    gallery: {
      title: "Gallery | Auburn VSA — Auburn University",
      description:
        "Photos and year recaps from Auburn VSA meetings, socials, and Auburn Royale at Auburn University.",
    },
    merch: {
      title: "Merch | Auburn VSA — Auburn University",
      description:
        "Shop Auburn VSA merch — shirts, sweatshirts, stickers, and more. Tap an item for details and buy links.",
    },
    faqs: {
      title: "FAQs | Auburn VSA — Auburn University",
      description:
        "FAQs about joining Auburn VSA (Vietnamese Student Association at Auburn University): meetings, membership, ACE, and Auburn Royale.",
    },
  };

  function ensureMeta(attr, key, value) {
    if (!value) return;
    var sel =
      attr === "property"
        ? 'meta[property="' + key + '"]'
        : 'meta[name="' + key + '"]';
    var node = document.head.querySelector(sel);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(attr, key);
      document.head.appendChild(node);
    }
    node.setAttribute("content", value);
  }

  function absoluteUrl(path, baseUrl) {
    var p = String(path || "").trim();
    if (!p) return "";
    if (/^(https?:)?\/\//i.test(p) || /^data:/i.test(p)) return p;
    var base = String(baseUrl || "").trim().replace(/\/$/, "");
    if (!base) {
      base = location.origin + location.pathname.replace(/[^/]*$/, "");
      base = base.replace(/\/$/, "");
    }
    if (p.charAt(0) === "/") {
      try {
        var u = new URL(base);
        return u.origin + p;
      } catch (err) {
        return location.origin + p;
      }
    }
    return base + "/" + p.replace(/^\.\//, "");
  }

  function siteOrigin(content) {
    var configured = String((content.site && content.site.publicBaseUrl) || "").trim().replace(/\/$/, "");
    if (configured) return configured;
    return location.origin + appBasePath();
  }

  function pageCanonicalPath() {
    var page = document.body.getAttribute("data-page") || "home";
    if (page === "home") return "/";
    if (page === "team") {
      var key =
        document.querySelector("[data-team]") &&
        document.querySelector("[data-team]").getAttribute("data-team");
      if (key === "techTeam") return "/tech-team";
      if (key === "royaleDirectors") return "/au-royale-directors";
      return "/executive-board";
    }
    var map = {
      events: "/events",
      royale: "/au-royale",
      gallery: "/gallery",
      merch: "/merch",
      faqs: "/faqs",
    };
    return map[page] || "/";
  }

  function ensureLink(rel, href) {
    if (!href) return;
    var node = document.head.querySelector('link[rel="' + rel + '"]');
    if (!node) {
      node = document.createElement("link");
      node.setAttribute("rel", rel);
      document.head.appendChild(node);
    }
    node.setAttribute("href", href);
  }

  function setJsonLd(id, data) {
    var node = document.getElementById(id);
    if (!node) {
      node = document.createElement("script");
      node.type = "application/ld+json";
      node.id = id;
      document.head.appendChild(node);
    }
    node.textContent = JSON.stringify(data);
  }

  function applyPageSeo(content) {
    var page = document.body.getAttribute("data-page") || "home";
    var seo = PAGE_SEO[page] || PAGE_SEO.home;
    var site = (content && content.site) || {};
    var org = site.orgName || "Vietnamese Student Association";
    var uni = site.university || "Auburn University";
    var description = seo.description;
    var title = seo.title;
    if (page === "team") {
      var teamKey =
        document.querySelector("[data-team]") &&
        document.querySelector("[data-team]").getAttribute("data-team");
      if (teamKey === "techTeam") {
        title = "Tech Team | Auburn VSA — Auburn University";
        description =
          "Meet Auburn VSA’s Tech Team — students who build and maintain the Vietnamese Student Association website and digital tools at Auburn University.";
      } else if (teamKey === "royaleDirectors") {
        title = "AU Royale Directors | Auburn VSA — Auburn University";
        description =
          "Meet the AU Royale Directors who plan Auburn VSA’s signature cultural carnival at Auburn University.";
      } else {
        title = "Executive Board | Auburn VSA — Auburn University";
        description =
          "Meet Auburn VSA’s Executive Board — student officers of the Vietnamese Student Association at Auburn University.";
      }
    }
    if (title) document.title = title;

    var descNode = document.querySelector('meta[name="description"]');
    if (descNode) descNode.setAttribute("content", description);
    else ensureMeta("name", "description", description);

    var logo =
      (content.branding && content.branding.logo) ||
      "uploads/20260718012849-aa5e521c7f.png";
    var origin = siteOrigin(content);
    var ogImage = absoluteUrl(logo, origin);
    var pageUrl = absoluteUrl(pageCanonicalPath(), origin);

    ensureMeta(
      "name",
      "robots",
      constructionModeOn(content)
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large",
    );
    // Site name Google may show instead of auburnvsa.com (also set og:site_name + WebSite JSON-LD).
    var siteName = "Auburn VSA";
    var siteNameLong = "Auburn VSA | Vietnamese Student Association";
    ensureMeta("name", "theme-color", "#ff811d");
    ensureMeta("name", "application-name", siteName);
    ensureMeta("name", "apple-mobile-web-app-title", siteName);
    ensureMeta("property", "og:locale", "en_US");
    ensureMeta("property", "og:type", page === "royale" ? "event" : "website");
    ensureMeta("property", "og:site_name", siteName);
    ensureMeta("property", "og:title", title || document.title);
    ensureMeta("property", "og:description", description);
    ensureMeta("property", "og:image", ogImage);
    ensureMeta("property", "og:url", pageUrl);
    ensureMeta("name", "twitter:card", "summary_large_image");
    ensureMeta("name", "twitter:title", title || document.title);
    ensureMeta("name", "twitter:description", description);
    ensureMeta("name", "twitter:image", ogImage);

    ensureLink("canonical", pageUrl);
    ensureLink("manifest", absoluteUrl("/site.webmanifest", origin));
    ensureLink("apple-touch-icon", ogImage);

    var sameAs = [];
    function pushSameAs(href) {
      var u = safeUrl(href);
      if (u && u.indexOf("http") === 0 && sameAs.indexOf(u) === -1) sameAs.push(u);
    }
    (content.socials || []).forEach(function (s) {
      if (!isContentVisible(s)) return;
      pushSameAs(s && s.href);
    });
    pushSameAs((content.links && content.links.join) || "");
    // sameAs comes from CMS socials + Join link only (no hardcoded extras).

    setJsonLd("ld-org", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      legalName: "Vietnamese Student Association at Auburn University",
      alternateName: [
        siteNameLong,
        "Auburn Vietnamese Student Association",
        org,
        "Vietnamese Student Association at Auburn University",
      ],
      url: origin + "/",
      logo: ogImage,
      email: site.email || undefined,
      telephone: telHrefFromPhone(site.phone) || undefined,
      sameAs: sameAs.length ? sameAs : undefined,
      parentOrganization: {
        "@type": "CollegeOrUniversity",
        name: uni,
        url: "https://www.auburn.edu/",
      },
    });

    setJsonLd("ld-website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      alternateName: [
        siteNameLong,
        "Vietnamese Student Association at Auburn University",
        "Auburn Vietnamese Student Association",
      ],
      url: origin + "/",
      description: PAGE_SEO.home.description,
      publisher: { "@type": "Organization", name: siteName, url: origin + "/" },
      inLanguage: "en-US",
    });

    setJsonLd("ld-webpage", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title || document.title,
      description: description,
      url: pageUrl,
      isPartOf: {
        "@type": "WebSite",
        name: siteName,
        url: origin + "/",
      },
    });

    if (page === "faqs" && Array.isArray(content.faqs) && content.faqs.length) {
      var visibleFaqs = content.faqs.filter(isContentVisible);
      setJsonLd("ld-faq", {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: visibleFaqs.slice(0, 40).map(function (faq) {
          return {
            "@type": "Question",
            name: String(faq.question || "").trim(),
            acceptedAnswer: {
              "@type": "Answer",
              text: String(faq.answer || "").trim(),
            },
          };
        }).filter(function (q) {
          return q.name && q.acceptedAnswer.text;
        }),
      });
    }

    if (page === "royale") {
      var royale = content.royale || {};
      var links = content.links || {};
      var ticketUrl = safeUrl(links.purchaseTickets || "");
      var startDay = String(royale.eventDateStart || "").trim();
      var timeStart = String(royale.eventDateTimeStart || "").trim();
      var timeEnd = String(royale.eventDateTimeEnd || "").trim();
      var startDate;
      var endDate;
      if (/^\d{4}-\d{2}-\d{2}$/.test(startDay)) {
        startDate = timeStart && /^\d{1,2}:\d{2}/.test(timeStart)
          ? startDay + "T" + timeStart + (timeStart.length === 5 ? ":00" : "")
          : startDay;
        if (timeEnd && /^\d{1,2}:\d{2}/.test(timeEnd)) {
          endDate = startDay + "T" + timeEnd + (timeEnd.length === 5 ? ":00" : "");
        }
      }
      var eventLd = {
        "@context": "https://schema.org",
        "@type": "Event",
        name: royale.heroTitle || "Auburn Royale",
        description: royale.introText || description,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: royale.eventLocation || "Auburn University",
          address: royale.eventLocation || "Auburn, AL",
        },
        organizer: {
          "@type": "Organization",
          name: "Auburn VSA",
          url: origin + "/",
        },
        image: ogImage,
        url: pageUrl,
      };
      if (startDate) eventLd.startDate = startDate;
      if (endDate) eventLd.endDate = endDate;
      if (ticketUrl) {
        eventLd.offers = {
          "@type": "Offer",
          url: ticketUrl,
          availability: "https://schema.org/InStock",
          priceCurrency: "USD",
        };
        if (royale.eventCost) eventLd.offers.description = String(royale.eventCost);
      }
      setJsonLd("ld-event", eventLd);
    }
  }

  // --- Theme (per-browser preference; localStorage key vsa-theme) ---
  var THEME_KEY = "vsa-theme";
  var THEME_ORDER = ["light", "dark", "system"];

  function getThemePref() {
    try {
      var p = localStorage.getItem(THEME_KEY);
      if (p !== "light" && p !== "dark" && p !== "system") return "light";
      return p;
    } catch (e) {
      return "light";
    }
  }

  function resolvedTheme(pref) {
    if (pref === "dark") return "dark";
    if (pref === "system") {
      try {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } catch (e2) {
        return "light";
      }
    }
    return "light";
  }

  function syncThemeToggle(pref, resolved) {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.setAttribute("data-pref", pref);
    btn.setAttribute("aria-pressed", resolved === "dark" ? "true" : "false");
    var labels = {
      light: "Color theme: Light. Click for Dark.",
      dark: "Color theme: Dark. Click for System.",
      system: "Color theme: System. Click for Light.",
    };
    btn.setAttribute("aria-label", labels[pref] || labels.light);
    btn.title = "Theme: " + (pref.charAt(0).toUpperCase() + pref.slice(1));
  }

  function applyTheme(pref, persist) {
    pref = pref || getThemePref();
    if (pref !== "light" && pref !== "dark" && pref !== "system") pref = "light";
    var resolved = resolvedTheme(pref);
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-theme-pref", pref);
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, pref);
      } catch (e) {}
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#152033" : "#ff811d");
    syncThemeToggle(pref, resolved);
  }

  function cycleTheme() {
    var cur = getThemePref();
    var i = THEME_ORDER.indexOf(cur);
    applyTheme(THEME_ORDER[(i + 1) % THEME_ORDER.length], true);
  }

  applyTheme(getThemePref(), false);
  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      cycleTheme();
    });
  }
  try {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onScheme = function () {
      if (getThemePref() === "system") applyTheme("system");
    };
    if (mq.addEventListener) mq.addEventListener("change", onScheme);
    else if (mq.addListener) mq.addListener(onScheme);
  } catch (e) {}

  // --- Overlay lock hygiene (public sheets / lightbox) ---
  // Native Save As / file dialogs deliver Escape + focus return; Escape handlers can
  // half-close a full-viewport overlay (opacity 0, still pointer-events auto) and
  // leave the page unclickable until reload. Mirror admin: inert while closing,
  // and sweep zombies when focus returns.
  var OVERLAY_CLOSE_MS = 320;
  var uiLockFocusTimer = null;

  function markOverlayClosing(el) {
    if (!el) return;
    el.style.pointerEvents = "none";
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
    el.setAttribute("data-closing", "1");
  }

  function scheduleOverlayHide(el, ms) {
    setTimeout(function () {
      if (!el || el.classList.contains("is-open")) return;
      el.classList.add("hidden");
      el.removeAttribute("data-closing");
      el.style.pointerEvents = "";
    }, ms == null ? OVERLAY_CLOSE_MS : ms);
  }

  function prepareOverlayOpen(el) {
    if (!el) return;
    el.removeAttribute("data-closing");
    el.style.pointerEvents = "";
    el.classList.remove("hidden");
    el.setAttribute("aria-hidden", "false");
  }

  function anyPublicOverlayOpen() {
    return !!(
      document.querySelector(".event-sheet.is-open") ||
      document.querySelector(".faq-sheet.is-open:not(.construction-sheet)") ||
      document.querySelector(".gallery-lightbox.is-open")
    );
  }

  function releaseUiLocks() {
    if (document.body.style.pointerEvents === "none") {
      document.body.style.pointerEvents = "";
    }
    if (document.documentElement.style.pointerEvents === "none") {
      document.documentElement.style.pointerEvents = "";
    }
    document
      .querySelectorAll(
        ".event-sheet:not(.hidden), .faq-sheet:not(.hidden):not(.construction-sheet), .gallery-lightbox:not(.hidden)",
      )
      .forEach(function (el) {
        if (el.classList.contains("is-open")) return;
        el.style.pointerEvents = "none";
        // Mid-open: aria-hidden is false before is-open — do not kill that frame.
        if (el.getAttribute("aria-hidden") === "true" || el.getAttribute("data-closing") === "1") {
          el.classList.add("hidden");
          el.removeAttribute("data-closing");
        }
      });
    if (!anyPublicOverlayOpen()) {
      document.body.classList.remove("event-sheet-lock", "faq-sheet-lock");
    }
    if (!document.querySelector(".nav-mobile.is-open")) {
      document.body.classList.remove("nav-mobile-lock");
    }
  }

  function scheduleReleaseUiLocks() {
    if (uiLockFocusTimer) clearTimeout(uiLockFocusTimer);
    uiLockFocusTimer = setTimeout(function () {
      uiLockFocusTimer = null;
      releaseUiLocks();
    }, 350);
  }

  window.addEventListener("focus", scheduleReleaseUiLocks);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") scheduleReleaseUiLocks();
  });
  document.addEventListener("contextmenu", function () {
    scheduleReleaseUiLocks();
  });

  // --- Nav / UI (works before content loads) ---
  var mobileBtn = document.getElementById("mobile-menu-button");
  var mobileMenu = document.getElementById("mobile-menu");
  if (mobileBtn && mobileMenu) {
    var mobileCloseTimer = null;
    function setMobileOpen(open) {
      if (mobileCloseTimer) {
        clearTimeout(mobileCloseTimer);
        mobileCloseTimer = null;
      }
      mobileBtn.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-mobile-lock", open);
      if (open) {
        mobileMenu.classList.remove("hidden");
        // Next frame so the open transition can run from collapsed state.
        requestAnimationFrame(function () {
          mobileMenu.classList.add("is-open");
        });
      } else {
        mobileMenu.classList.remove("is-open");
        mobileCloseTimer = setTimeout(function () {
          mobileMenu.classList.add("hidden");
          mobileCloseTimer = null;
        }, 320);
      }
    }
    mobileBtn.addEventListener("click", function () {
      var open = !mobileMenu.classList.contains("is-open");
      setMobileOpen(open);
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMobileOpen(false);
      });
    });
  }

  var dropdowns = Array.prototype.slice.call(document.querySelectorAll(".dropdown"));
  var dropdownCloseTimers = new WeakMap();

  function setOpen(dropdown, open) {
    var menu = dropdown.querySelector(".dropdown-menu");
    var toggle = dropdown.querySelector(".dropdown-toggle");
    if (menu) menu.classList.toggle("open", open);
    if (toggle) {
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    }
  }

  function clearDropdownClose(dropdown) {
    var t = dropdownCloseTimers.get(dropdown);
    if (t) {
      clearTimeout(t);
      dropdownCloseTimers.delete(dropdown);
    }
  }

  dropdowns.forEach(function (dropdown) {
    var toggle = dropdown.querySelector(".dropdown-toggle");
    var menu = dropdown.querySelector(".dropdown-menu");
    if (toggle) {
      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        clearDropdownClose(dropdown);
        var isOpen = menu && menu.classList.contains("open");
        dropdowns.forEach(function (d) {
          clearDropdownClose(d);
          setOpen(d, false);
        });
        setOpen(dropdown, !isOpen);
      });
    }
    dropdown.addEventListener("mouseenter", function () {
      clearDropdownClose(dropdown);
      dropdowns.forEach(function (d) {
        if (d !== dropdown) {
          clearDropdownClose(d);
          setOpen(d, false);
        }
      });
      setOpen(dropdown, true);
    });
    dropdown.addEventListener("mouseleave", function () {
      clearDropdownClose(dropdown);
      // Brief delay so the cursor can cross into the menu without closing.
      var t = setTimeout(function () {
        setOpen(dropdown, false);
        dropdownCloseTimers.delete(dropdown);
      }, 180);
      dropdownCloseTimers.set(dropdown, t);
    });
  });

  document.addEventListener("click", function () {
    dropdowns.forEach(function (d) {
      setOpen(d, false);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      dropdowns.forEach(function (d) {
        setOpen(d, false);
      });
    }
  });

  var activeNav = document.body.getAttribute("data-nav");
  if (activeNav) {
    document.querySelectorAll("a[data-nav], button[data-nav]").forEach(function (el) {
      if (el.getAttribute("data-nav") === activeNav) {
        el.classList.add("active");
      }
    });
  }

  function bindFaqAccordion(root) {
    (root || document).querySelectorAll(".faq-q").forEach(function (btn) {
      if (btn.getAttribute("data-bound")) return;
      btn.setAttribute("data-bound", "1");
      btn.addEventListener("click", function () {
        var item = btn.closest(".faq-item");
        if (!item) return;
        var isOpen = !item.classList.contains("open");
        item.classList.toggle("open", isOpen);
        btn.setAttribute("aria-expanded", String(isOpen));
      });
    });
  }

  document.querySelectorAll("form[data-newsletter]").forEach(function (form) {
    if (!form.querySelector('input[name="website"]')) {
      var hp = document.createElement("input");
      hp.className = "faq-hp";
      hp.type = "text";
      hp.name = "website";
      hp.tabIndex = -1;
      hp.autocomplete = "off";
      hp.setAttribute("aria-hidden", "true");
      form.appendChild(hp);
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector('input[name="email"]');
      var msg = form.querySelector("[data-newsletter-msg]");
      var btn = form.querySelector('button[type="submit"]');
      var hpField = form.querySelector('input[name="website"]');
      if (!input || !msg) return;
      if (form.getAttribute("data-busy") === "1") return;
      var email = input.value.trim();
      form.setAttribute("data-busy", "1");
      if (btn) btn.disabled = true;
      msg.classList.remove("hidden");
      msg.textContent = "Subscribing…";
      fetch(appUrl("/api/newsletter.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subscribe",
          email: email,
          website: hpField ? hpField.value : "",
        }),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          if (res.data && res.data.ok) {
            msg.textContent = res.data.message || "Thanks! You have been added to the list.";
            input.value = "";
          } else {
            msg.textContent = (res.data && res.data.error) || "Could not subscribe. Try again.";
          }
        })
        .catch(function () {
          msg.textContent = "Could not subscribe. Try again.";
        })
        .finally(function () {
          form.removeAttribute("data-busy");
          if (btn) btn.disabled = false;
        });
    });
  });

  function bindUnsubscribeForm(form, mode) {
    var msg = form.querySelector("[data-unsubscribe-msg]");
    var btn = form.querySelector('button[type="submit"]');
    var hpField = form.querySelector('input[name="vsa_hp"], input[name="website"]');
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!msg) return;
      if (form.getAttribute("data-busy") === "1") return;

      var payload = {
        action: "unsubscribe",
        vsa_hp: hpField ? hpField.value : "",
      };

      if (mode === "token") {
        var tokenInput = form.querySelector('input[name="token"]');
        var t = (tokenInput && tokenInput.value ? tokenInput.value : "").trim();
        if (!t) {
          msg.classList.remove("hidden");
          msg.classList.add("is-error");
          msg.textContent = "Missing unsubscribe link. Enter your email on this page instead.";
          return;
        }
        payload.token = t;
      } else {
        var emailInput = form.querySelector('input[name="email"]');
        var confirmInput = form.querySelector('input[name="emailConfirm"]');
        var email = emailInput ? emailInput.value.trim() : "";
        var confirm = confirmInput ? confirmInput.value.trim() : "";
        if (!email) {
          msg.classList.remove("hidden");
          msg.classList.add("is-error");
          msg.textContent = "Please enter your email address.";
          return;
        }
        if (email.toLowerCase() !== confirm.toLowerCase()) {
          msg.classList.remove("hidden");
          msg.classList.add("is-error");
          msg.textContent = "Email confirmation does not match.";
          return;
        }
        payload.email = email;
        payload.emailConfirm = confirm;
      }

      form.setAttribute("data-busy", "1");
      if (btn) btn.disabled = true;
      // Autofill sometimes fills the hidden honeypot; always clear it for real browser submits.
      if (hpField) hpField.value = "";
      payload.vsa_hp = "";
      msg.classList.remove("hidden", "is-error", "is-ok");
      msg.textContent = mode === "token" ? "Unsubscribing…" : "Sending request to Auburn VSA…";
      fetch(appUrl("/api/newsletter.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
        cache: "no-store",
      })
        .then(function (r) {
          return r
            .json()
            .then(function (data) {
              return { ok: r.ok, status: r.status, data: data || {} };
            })
            .catch(function () {
              return { ok: false, status: r.status, data: { error: "Unexpected response from server." } };
            });
        })
        .then(function (res) {
          var data = res.data || {};
          var confirmed =
            mode === "token"
              ? !!(data.ok)
              : !!(data.ok && data.confirmed && data.requestId);
          if (confirmed) {
            msg.classList.add("is-ok");
            msg.textContent =
              data.message ||
              (mode === "token"
                ? "You are unsubscribed. You will not receive future VSA newsletters at this address."
                : "Request received by Auburn VSA. An admin will finish removing this address.");
            if (btn) btn.style.display = "none";
            form.classList.add("is-submitted");
            form.querySelectorAll("label, input:not([type='hidden']), button[type='submit']").forEach(function (node) {
              if (node.classList && node.classList.contains("faq-hp")) return;
              node.style.display = "none";
            });
          } else {
            msg.classList.add("is-error");
            msg.textContent =
              data.error ||
              (data.ok
                ? "Could not confirm your request was saved for admin review. Please try again."
                : "Could not send your request. Please try again.");
          }
        })
        .catch(function () {
          msg.classList.add("is-error");
          msg.textContent = "Network error — could not reach Auburn VSA. Please try again.";
        })
        .finally(function () {
          form.removeAttribute("data-busy");
          if (btn && btn.style.display !== "none") btn.disabled = false;
        });
    });
  }

  (function initUnsubscribePage() {
    var tokenForm = document.querySelector("form[data-unsubscribe-token]");
    var emailForm = document.querySelector("form[data-unsubscribe]");
    var panel = document.querySelector("[data-unsubscribe-token-panel]");
    var emailPanel = document.querySelector("[data-unsubscribe-email-panel]");
    var lead = document.querySelector("[data-unsubscribe-lead]");
    var masked = document.querySelector("[data-unsubscribe-masked]");

    var token = "";
    try {
      var params = new URLSearchParams(window.location.search || "");
      token = (params.get("t") || params.get("token") || "").trim().toLowerCase();
    } catch (err) {
      token = "";
    }

    if (tokenForm) bindUnsubscribeForm(tokenForm, "token");
    if (emailForm) bindUnsubscribeForm(emailForm, "email");

    if (token && tokenForm) {
      var tokenInput = tokenForm.querySelector('input[name="token"]');
      if (tokenInput) tokenInput.value = token;
      if (lead) {
        lead.textContent = "Confirm below to leave the Auburn VSA newsletter list.";
      }
      if (panel) panel.classList.remove("hidden");
      if (emailPanel) emailPanel.classList.add("hidden");
      fetch(appUrl("/api/newsletter.php") + "?t=" + encodeURIComponent(token), {
        credentials: "same-origin",
        cache: "no-store",
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          if (data && data.ok && data.found && masked) {
            masked.textContent = data.emailMasked || "this address";
          } else if (masked) {
            masked.textContent = "this address";
          }
        })
        .catch(function () {
          if (masked) masked.textContent = "this address";
        });
    }
  })();

  (function initFaqAskSheet() {
    var sheet = document.querySelector("[data-faq-sheet]");
    var form = document.querySelector("form[data-faq-ask]");
    if (!sheet || !form) return;

    var openBtns = document.querySelectorAll("[data-faq-sheet-open]");
    var closeEls = sheet.querySelectorAll("[data-faq-sheet-close]");
    var submitBtn = sheet.querySelector("[data-faq-sheet-submit]");
    var msg = form.querySelector("[data-faq-ask-msg]");
    var openTimer = null;

    function openSheet() {
      prepareOverlayOpen(sheet);
      document.body.classList.add("faq-sheet-lock");
      if (msg) {
        msg.classList.add("hidden");
        msg.classList.remove("is-error", "is-ok");
        msg.textContent = "";
      }
      // Next frame so CSS transitions run
      requestAnimationFrame(function () {
        sheet.classList.add("is-open");
      });
      openTimer = setTimeout(function () {
        var q = form.querySelector('[name="question"]');
        if (q) q.focus();
      }, 280);
    }

    function closeSheet() {
      if (openTimer) clearTimeout(openTimer);
      markOverlayClosing(sheet);
      document.body.classList.remove("faq-sheet-lock");
      scheduleOverlayHide(sheet);
    }

    openBtns.forEach(function (btn) {
      btn.addEventListener("click", openSheet);
    });
    closeEls.forEach(function (el) {
      el.addEventListener("click", closeSheet);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sheet.classList.contains("is-open")) {
        e.preventDefault();
        closeSheet();
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = form.querySelector('[name="question"]');
      var name = form.querySelector('[name="name"]');
      var email = form.querySelector('[name="email"]');
      var hp = form.querySelector('[name="website"]');
      if (!q || !msg) return;
      msg.classList.remove("hidden", "is-error", "is-ok");
      msg.textContent = "Sending…";
      if (submitBtn) submitBtn.disabled = true;
      fetch(appUrl("/api/faq-ask.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.value.trim(),
          name: name ? name.value.trim() : "",
          email: email ? email.value.trim() : "",
          website: hp ? hp.value : "",
        }),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          if (submitBtn) submitBtn.disabled = false;
          if (res.data && res.data.ok) {
            msg.classList.remove("is-error");
            msg.classList.add("is-ok");
            msg.textContent = res.data.message || "Thanks! Your question was submitted.";
            form.reset();
            setTimeout(closeSheet, 1100);
          } else {
            msg.classList.add("is-error");
            msg.classList.remove("is-ok");
            msg.textContent = (res.data && res.data.error) || "Could not send. Try again.";
          }
        })
        .catch(function () {
          if (submitBtn) submitBtn.disabled = false;
          msg.classList.add("is-error");
          msg.classList.remove("is-ok");
          msg.textContent = "Could not send. Try again.";
        });
    });
  })();

  // --- Content hydration ---
  function fillChrome(content) {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
    document.querySelectorAll("[data-bind]").forEach(function (el) {
      el.textContent = getPath(content, el.getAttribute("data-bind"));
    });
    var logo = safeMediaUrl(getPath(content, "branding.logo") || "");
    document.querySelectorAll("[data-bind-src]").forEach(function (el) {
      var path = el.getAttribute("data-bind-src");
      var src = safeMediaUrl(getPath(content, path) || "");
      if (src) {
        el.setAttribute("src", src);
        el.removeAttribute("hidden");
      } else if (path === "branding.logo") {
        el.removeAttribute("src");
        el.setAttribute("hidden", "");
      }
    });

    // Tab / favicon uses the same branding logo (no hardcoded placeholder).
    var favicon = document.querySelector('link[rel="icon"]');
    if (favicon && logo) {
      favicon.setAttribute("href", logo);
    }

    var socials = content.socials || [];
    var list = document.getElementById("site-socials");
    if (list) {
      list.innerHTML = socials
        .filter(function (s) {
          return isContentVisible(s) && !!safeUrl(s && s.href);
        })
        .map(function (s) {
          var href = safeUrl(s.href);
          return (
            '<li><a href="' +
            escapeHtml(href) +
            '" aria-label="' +
            escapeHtml(s.label || "") +
            '" target="_blank" rel="noopener noreferrer">' +
            socialIconMarkup(s) +
            '<span class="visually-hidden">' +
            escapeHtml(s.label || "Social link") +
            "</span></a></li>"
          );
        })
        .join("");
    }

    // Make contact details tappable on mobile.
    document.querySelectorAll("[data-bind='site.email']").forEach(function (el) {
      var email = (el.textContent || "").trim();
      if (!email || el.tagName === "A") return;
      var a = document.createElement("a");
      a.href = "mailto:" + email;
      a.className = "contact-link";
      a.textContent = email;
      el.replaceWith(a);
    });
    document.querySelectorAll("[data-bind='site.phone']").forEach(function (el) {
      var raw = getPath(content, "site.phone") || (el.textContent || "").trim();
      var custom = getPath(content, "site.phoneCustomFormat") || "no";
      var phone = displayPhone(raw, custom);
      var row = el.closest(".footer-contact, .topbar-inner > span") || el.parentElement;
      if (!phone) {
        if (row && row !== document.body) {
          row.classList.add("hidden");
          row.setAttribute("hidden", "hidden");
        }
        return;
      }
      if (row) {
        row.classList.remove("hidden");
        row.removeAttribute("hidden");
      }
      var tel = telHrefFromPhone(raw);
      if (el.tagName === "A") {
        if (tel) el.href = "tel:" + tel;
        el.textContent = phone;
        return;
      }
      if (!tel) {
        el.textContent = phone;
        return;
      }
      var a = document.createElement("a");
      a.href = "tel:" + tel;
      a.className = "contact-link";
      a.textContent = phone;
      a.setAttribute("data-bind", "site.phone");
      el.replaceWith(a);
    });

    var site = content.site || {};
    var newsletterHeading =
      (site.newsletterHeading || "").trim() || "Sign Up for VSA Newsletters";
    document.querySelectorAll(".newsletter h2").forEach(function (el) {
      el.textContent = newsletterHeading;
    });
    var newsletterButton = (site.newsletterButton || "").trim() || "Subscribe";
    document.querySelectorAll("form[data-newsletter] button[type='submit']").forEach(function (el) {
      el.textContent = newsletterButton;
    });
    var newsletterEmailLabel = (site.newsletterEmailLabel || "").trim() || "Email";
    document.querySelectorAll("[data-newsletter-email-label]").forEach(function (el) {
      el.textContent = newsletterEmailLabel;
    });
    var contactEmailLabel = (site.contactEmailLabel || "").trim() || "Email:";
    document.querySelectorAll("[data-contact-email-label]").forEach(function (el) {
      el.textContent = contactEmailLabel;
    });
    var contactPhoneLabel = (site.contactPhoneLabel || "").trim() || "Phone:";
    document.querySelectorAll("[data-contact-phone-label]").forEach(function (el) {
      el.textContent = contactPhoneLabel;
    });
    var unsubscribeLinkLabel = (site.unsubscribeLinkLabel || "").trim() || "Unsubscribe";
    document.querySelectorAll(".footer-legal-links a[href='unsubscribe'], .footer-legal-links a[href$='/unsubscribe']").forEach(function (el) {
      el.textContent = unsubscribeLinkLabel;
    });
    var skipLinkLabel = (site.skipLinkLabel || "").trim() || "Skip to main content";
    document.querySelectorAll("a.skip-link").forEach(function (el) {
      el.textContent = skipLinkLabel;
    });

    function setNavText(selector, label) {
      var text = (label || "").trim();
      if (!text) return;
      document.querySelectorAll(selector).forEach(function (el) {
        if (el.tagName === "BUTTON") {
          var svg = el.querySelector("svg");
          var keep = svg ? svg.cloneNode(true) : null;
          el.textContent = "";
          el.appendChild(document.createTextNode(text + " "));
          if (keep) el.appendChild(keep);
          return;
        }
        el.textContent = text;
      });
    }
    setNavText('a.nav-link[data-nav="home"], .nav-mobile a[data-nav="home"]', site.navHome || "Home");
    setNavText(
      'button.nav-link.dropdown-toggle[data-nav="about"], .nav-mobile > .nav-mobile-group > a[data-nav="about"]',
      site.navAbout || "About",
    );
    setNavText(
      '.dropdown-menu a[href="executive-board"], .nav-mobile-children a[href="executive-board"]',
      site.navExecutiveBoard || "Executive Board",
    );
    setNavText(
      '.dropdown-menu a[href="au-royale-directors"], .nav-mobile-children a[href="au-royale-directors"]',
      site.navRoyaleDirectors || "AU Royale Directors",
    );
    setNavText(
      '.dropdown-menu a[href="tech-team"], .nav-mobile-children a[href="tech-team"]',
      site.navTechTeam || "Tech Team",
    );
    setNavText('a.nav-link[data-nav="events"], .nav-mobile a[data-nav="events"]', site.navEvents || "Events");
    setNavText('a.nav-link[data-nav="royale"], .nav-mobile a[data-nav="royale"]', site.navRoyale || "AU Royale");
    setNavText('a.nav-link[data-nav="gallery"], .nav-mobile a[data-nav="gallery"]', site.navGallery || "Gallery");
    setNavText('a.nav-link[data-nav="merch"], .nav-mobile a[data-nav="merch"]', site.navMerch || "Merch");
    setNavText('a.nav-link[data-nav="faqs"], .nav-mobile a[data-nav="faqs"]', site.navFaqs || "FAQs");

    var footerCopyright =
      (site.footerCopyright || "").trim() ||
      "Auburn Vietnamese Student Association. All rights reserved.";
    document.querySelectorAll(".footer-copy").forEach(function (el) {
      var yearEl = el.querySelector("[data-year]");
      var year = yearEl
        ? yearEl.textContent
        : String(new Date().getFullYear());
      el.textContent = "";
      el.appendChild(document.createTextNode("© "));
      var y = document.createElement("span");
      y.setAttribute("data-year", "");
      y.textContent = year;
      el.appendChild(y);
      el.appendChild(document.createTextNode(" " + footerCopyright));
    });

    setText("#unsubscribe-kicker", site.unsubscribeKicker || "Newsletter");
    setText("#unsubscribe-heading", site.unsubscribeHeading || "Unsubscribe");
    setText(
      "#unsubscribe-lead",
      site.unsubscribeLead ||
        "Enter the email you used to subscribe and we’ll process your request.",
    );
    setText(
      "#unsubscribe-confirm-btn",
      site.unsubscribeConfirmButton || "Confirm unsubscribe",
    );
    setText(
      "#unsubscribe-request-btn",
      site.unsubscribeRequestButton || "Request unsubscribe",
    );
    var unsubNote = document.getElementById("unsubscribe-note");
    if (unsubNote) {
      var note =
        (site.unsubscribeNote || "").trim() ||
        "Changed your mind? Subscribe again anytime from the footer on auburnvsa.com.";
      unsubNote.textContent = note;
    }

    if (document.body.getAttribute("data-page") !== "home") {
      renderNextUp(content);
    }

    // ===== BEGIN HOLIDAY_THEMES (safe to delete this call + applyHolidayTheme) =====
    applyHolidayTheme(content);
    // ===== END HOLIDAY_THEMES =====
    // ===== BEGIN BUTTON_EFFECTS (safe to delete this call + applyButtonEffect) =====
    applyButtonEffect(content);
    // ===== END BUTTON_EFFECTS =====
    // ===== BEGIN EASTER_EGG_MUSIC (safe to delete this call + initEasterEggMusic) =====
    initEasterEggMusic(content);
    // ===== END EASTER_EGG_MUSIC =====
  }

  // ===== BEGIN HOLIDAY_THEMES (safe to delete this whole block) =====
  var HOLIDAY_PREF_KEY = "vsa-holiday-pref";

  /** html[data-holiday] → header color takeover + right-side mark (no stripes). */
  function applyHolidayTheme(content) {
    var raw = String(getPath(content, "site.holidayTheme") || "auto")
      .toLowerCase()
      .trim();
    try {
      localStorage.setItem(HOLIDAY_PREF_KEY, raw || "auto");
    } catch (e) {}
    paintHolidayTheme(raw);
  }

  // ===== BEGIN BUTTON_EFFECTS (safe to delete this whole block) =====
  var BTN_EFFECT_KEY = "vsa-btn-effect";
  var BTN_EFFECT_ALLOWED = {
    flat: 1,
    lift: 1,
    shine: 1,
    jelly: 1,
    playful: 1,
    pop: 1,
    pulse: 1,
    fill: 1,
    neon: 1,
    wiggle: 1,
  };

  function applyButtonEffect(content) {
    var raw = String(getPath(content, "site.buttonEffect") || "lift")
      .toLowerCase()
      .trim();
    if (!BTN_EFFECT_ALLOWED[raw]) raw = "lift";
    try {
      localStorage.setItem(BTN_EFFECT_KEY, raw);
    } catch (e) {}
    paintButtonEffect(raw);
  }

  function paintButtonEffect(raw) {
    if (!BTN_EFFECT_ALLOWED[raw]) raw = "lift";
    document.documentElement.setAttribute("data-btn-effect", raw);
    ensurePlayfulButtonFont(raw === "playful");
  }

  function ensurePlayfulButtonFont(need) {
    var id = "vsa-btn-playful-font";
    var existing = document.getElementById(id);
    if (!need) {
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      return;
    }
    if (existing) return;
    var link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Comic+Neue:wght@700&display=swap";
    document.head.appendChild(link);
  }

  // Boot from last known preference so buttons don't flash flat → playful.
  try {
    var bootBtn = localStorage.getItem(BTN_EFFECT_KEY);
    if (bootBtn && BTN_EFFECT_ALLOWED[bootBtn]) paintButtonEffect(bootBtn);
    else document.documentElement.setAttribute("data-btn-effect", "lift");
  } catch (eBootBtn) {
    document.documentElement.setAttribute("data-btn-effect", "lift");
  }
  // ===== END BUTTON_EFFECTS =====

  function paintHolidayTheme(raw) {
    var allowed = {
      halloween: 1,
      christmas: 1,
      july4: 1,
      valentines: 1,
      newyear: 1,
      stpatricks: 1,
    };
    raw = String(raw || "auto")
      .toLowerCase()
      .trim();
    var theme = "";
    if (raw === "off") {
      theme = "";
    } else if (allowed[raw]) {
      theme = raw;
    } else {
      theme = holidayThemeForDate(new Date());
    }
    var leftover = document.getElementById("holiday-decor");
    if (leftover) leftover.remove();
    document.querySelectorAll(".holiday-logo-hat").forEach(function (el) {
      el.remove();
    });
    var root = document.documentElement;
    if (!theme) {
      root.removeAttribute("data-holiday");
      root.style.removeProperty("--holiday-mark");
      return;
    }
    root.setAttribute("data-holiday", theme);
    if (theme === "newyear") {
      var mark = chineseNewYearMark(new Date());
      root.style.setProperty("--holiday-mark", JSON.stringify(mark));
    } else {
      root.style.removeProperty("--holiday-mark");
    }
  }

  /** Inclusive MMDD windows (visitor local date). Valentine wins over CNY overlap. */
  function holidayThemeForDate(d) {
    var md = (d.getMonth() + 1) * 100 + d.getDate();
    if (md >= 207 && md <= 215) return "valentines"; // Feb 7–15
    if (md >= 120 && md <= 228) return "newyear"; // Chinese New Year season
    if (md >= 310 && md <= 318) return "stpatricks"; // Mar 10–18
    if (md >= 628 && md <= 706) return "july4"; // Jun 28–Jul 6
    if (md >= 1015 && md <= 1102) return "halloween"; // Oct 15–Nov 2
    if (md >= 1201 && md <= 1227) return "christmas"; // Dec 1–27
    return "";
  }

  /**
   * CNY header mark: 🧧 {lunarYear} {animal}.
   * Year/animal follow the lunar new year (not just Jan 1). Table covers
   * nearby years; unknown years fall back to ~Feb 4 cutoff.
   */
  function chineseNewYearMark(d) {
    var y = lunarZodiacYear(d);
    var animals = ["🐀", "🐂", "🐅", "🐇", "🐉", "🐍", "🐎", "🐐", "🐒", "🐓", "🐕", "🐖"];
    var idx = (y - 4) % 12;
    if (idx < 0) idx += 12;
    var animal = animals[idx];
    // Compact on phones so the mark does not cover theme/hamburger controls
    try {
      if (window.matchMedia && window.matchMedia("(max-width: 720px)").matches) {
        return "🧧 " + animal;
      }
    } catch (e) {}
    return "🧧 " + y + " " + animal;
  }

  function lunarZodiacYear(d) {
    var y = d.getFullYear();
    // First day of Chinese New Year (month is 1-based)
    var cnyStart = {
      2024: [2, 10],
      2025: [1, 29],
      2026: [2, 17],
      2027: [2, 6],
      2028: [1, 26],
      2029: [2, 13],
      2030: [2, 3],
      2031: [1, 23],
      2032: [2, 11],
      2033: [1, 31],
      2034: [2, 19],
      2035: [2, 8],
      2036: [1, 28],
      2037: [2, 15],
      2038: [2, 4],
      2039: [1, 24],
      2040: [2, 12],
      2041: [2, 1],
      2042: [1, 22],
      2043: [2, 10],
      2044: [1, 30],
      2045: [2, 17],
      2046: [2, 6],
      2047: [1, 26],
      2048: [2, 14],
      2049: [2, 2],
      2050: [1, 23],
    };
    var start = cnyStart[y];
    var md = (d.getMonth() + 1) * 100 + d.getDate();
    if (start) {
      var cnyMd = start[0] * 100 + start[1];
      return md < cnyMd ? y - 1 : y;
    }
    // Fallback when outside the table
    return md < 204 ? y - 1 : y;
  }
  // ===== END HOLIDAY_THEMES =====

  // ===== BEGIN EASTER_EGG_MUSIC (safe to delete this whole block) =====
  var EGG_MUSIC_UNLOCK_KEY = "vsa-egg-music-unlocked";
  var EGG_MUSIC_COLLAPSE_KEY = "vsa-egg-music-collapsed";
  var EGG_MUSIC_REPEAT_KEY = "vsa-egg-music-repeat";
  var EGG_MUSIC_VOLUME_KEY = "vsa-egg-music-volume";
  var eggMusicBound = false;

  function initEasterEggMusic(content) {
    var music = (content && content.music) || {};
    var enabled = String(music.enabled || "no").toLowerCase() === "yes";
    var need = parseInt(music.clickCount, 10);
    if (!isFinite(need) || need < 1) need = 7;
    if (need > 20) need = 20;

    var tracks = Array.isArray(music.tracks)
      ? music.tracks
          .map(function (t) {
            if (!t || typeof t !== "object") return null;
            var src = safeMediaUrl(t.src || "");
            if (!src) return null;
            return {
              title: String(t.title || "").trim() || "Untitled",
              artist: String(t.artist || "").trim(),
              src: src,
            };
          })
          .filter(Boolean)
      : [];

    var logoWrap = document.querySelector(".site-footer .brand-logo.lg");
    if (!enabled || !tracks.length || !logoWrap) {
      var stale = document.getElementById("egg-music-player");
      if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
      if (logoWrap) {
        logoWrap.classList.remove("is-egg-hot");
        logoWrap.removeAttribute("role");
        logoWrap.removeAttribute("tabindex");
        logoWrap.removeAttribute("aria-label");
      }
      return;
    }

    logoWrap.classList.add("is-egg-hot");
    logoWrap.setAttribute("role", "button");
    logoWrap.setAttribute("tabindex", "0");
    logoWrap.setAttribute(
      "aria-label",
      "Auburn VSA logo. Click repeatedly for a surprise.",
    );

    var unlocked = false;
    try {
      unlocked = localStorage.getItem(EGG_MUSIC_UNLOCK_KEY) === "1";
    } catch (e) {}

    var clicks = 0;
    var playerEl = null;
    var audio = null;
    var index = 0;
    var collapsed = false;
    try {
      collapsed = localStorage.getItem(EGG_MUSIC_COLLAPSE_KEY) === "1";
    } catch (e2) {}
    var repeatMode = "all"; // off | all | one
    try {
      var storedRepeat = localStorage.getItem(EGG_MUSIC_REPEAT_KEY);
      if (storedRepeat === "off" || storedRepeat === "all" || storedRepeat === "one") {
        repeatMode = storedRepeat;
      }
    } catch (e5) {}
    var volume = 0.8;
    try {
      var storedVolume = parseFloat(localStorage.getItem(EGG_MUSIC_VOLUME_KEY));
      if (isFinite(storedVolume) && storedVolume >= 0 && storedVolume <= 1) {
        volume = storedVolume;
      }
    } catch (e9) {}

    function isUnlocked() {
      try {
        if (localStorage.getItem(EGG_MUSIC_UNLOCK_KEY) === "1") return true;
      } catch (e7) {}
      return unlocked;
    }

    function clearUnlock() {
      unlocked = false;
      clicks = 0;
      try {
        localStorage.removeItem(EGG_MUSIC_UNLOCK_KEY);
      } catch (e8) {}
    }

    function svgIcon(paths) {
      return (
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
        paths +
        "</svg>"
      );
    }

    function fmtTime(sec) {
      if (!isFinite(sec) || sec < 0) return "0:00";
      var s = Math.floor(sec % 60);
      var m = Math.floor(sec / 60);
      return m + ":" + (s < 10 ? "0" : "") + s;
    }

    function persistUnlock() {
      try {
        localStorage.setItem(EGG_MUSIC_UNLOCK_KEY, "1");
      } catch (e3) {}
      unlocked = true;
    }

    function persistCollapsed() {
      try {
        localStorage.setItem(EGG_MUSIC_COLLAPSE_KEY, collapsed ? "1" : "0");
      } catch (e4) {}
    }

    function persistRepeat() {
      try {
        localStorage.setItem(EGG_MUSIC_REPEAT_KEY, repeatMode);
      } catch (e6) {}
    }

    function persistVolume() {
      try {
        localStorage.setItem(EGG_MUSIC_VOLUME_KEY, String(volume));
      } catch (e10) {}
    }

    var ICON_PREV =
      '<path d="M18 6v12M6 12l8-6v12l-8-6z" fill="currentColor" stroke="none"/>';
    var ICON_NEXT =
      '<path d="M6 6v12M18 12l-8-6v12l8-6z" fill="currentColor" stroke="none"/>';
    var ICON_PLAY = '<path d="M8 6l12 6-12 6V6z" fill="currentColor" stroke="none"/>';
    var ICON_PAUSE =
      '<path d="M7 6h3.5v12H7V6zm6.5 0H17v12h-3.5V6z" fill="currentColor" stroke="none"/>';
    var ICON_REPEAT =
      '<path d="M17 3l3 3-3 3M7 21l-3-3 3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 6H8a4 4 0 0 0-4 4v1M4 18h12a4 4 0 0 0 4-4v-1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    var ICON_QUEUE =
      '<path d="M4 7h11M4 12h11M4 17h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 17l3-2-3-2z" fill="currentColor" stroke="none"/>';
    var ICON_VOLUME =
      '<path d="M4 10v4h4l5 4V6l-5 4H4z" fill="currentColor" stroke="none"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
    var ICON_MUTED =
      '<path d="M4 10v4h4l5 4V6l-5 4H4z" fill="currentColor" stroke="none"/><path d="M17 10l4 4M21 10l-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';

    function ensurePlayer() {
      if (playerEl) return playerEl;
      playerEl = document.createElement("div");
      playerEl.id = "egg-music-player";
      playerEl.className = "egg-music-player" + (collapsed ? " is-collapsed" : "");
      playerEl.setAttribute("role", "region");
      playerEl.setAttribute("aria-label", "Music player");
      playerEl.innerHTML =
        '<div class="egg-music-shell">' +
        '<div class="egg-music-top">' +
        '<div class="egg-music-meta">' +
        '<span class="egg-music-kicker">Auburn VSA</span>' +
        '<span class="egg-music-title" data-egg-title></span>' +
        '<span class="egg-music-artist" data-egg-artist></span>' +
        "</div>" +
        '<div class="egg-music-tools">' +
        '<button type="button" class="egg-music-queue-btn" aria-label="Browse songs" aria-pressed="false" data-egg-queue>' +
        svgIcon(ICON_QUEUE) +
        "</button>" +
        '<button type="button" class="egg-music-collapse" aria-label="Collapse player" data-egg-collapse>' +
        svgIcon('<path d="M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>') +
        "</button>" +
        '<button type="button" class="egg-music-close" aria-label="Hide player" data-egg-close>' +
        svgIcon(
          '<path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        ) +
        "</button>" +
        "</div></div>" +
        '<input type="range" class="egg-music-progress" min="0" max="1000" value="0" aria-label="Seek" data-egg-seek />' +
        '<div class="egg-music-time"><span data-egg-cur>0:00</span><span data-egg-dur>0:00</span></div>' +
        '<div class="egg-music-transport">' +
        '<button type="button" class="egg-music-expand" aria-label="Expand player" data-egg-expand>' +
        svgIcon(
          '<path d="M15 5l-6 7 6 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
        ) +
        "</button>" +
        '<button type="button" class="egg-music-prev" aria-label="Previous track" data-egg-prev>' +
        svgIcon(ICON_PREV) +
        "</button>" +
        '<button type="button" class="egg-music-play" aria-label="Play" data-egg-play>' +
        svgIcon(ICON_PLAY) +
        "</button>" +
        '<button type="button" class="egg-music-next" aria-label="Next track" data-egg-next>' +
        svgIcon(ICON_NEXT) +
        "</button>" +
        '<button type="button" class="egg-music-repeat" aria-label="Repeat" data-egg-repeat>' +
        svgIcon(ICON_REPEAT) +
        '<span class="egg-music-repeat-one" aria-hidden="true">1</span>' +
        "</button>" +
        '<div class="egg-music-volume">' +
        '<button type="button" class="egg-music-volume-btn" aria-label="Volume" aria-expanded="false" data-egg-volume-btn>' +
        svgIcon(ICON_VOLUME) +
        "</button>" +
        '<div class="egg-music-volume-popover" data-egg-volume-popover hidden>' +
        '<input type="range" class="egg-music-volume-slider" min="0" max="100" value="80" aria-label="Volume" orient="vertical" data-egg-volume />' +
        "</div>" +
        "</div>" +
        "</div>" +
        '<div class="egg-music-queue-panel" data-egg-queue-panel hidden>' +
        '<p class="egg-music-queue-title">Songs</p>' +
        '<ul class="egg-music-queue-list" data-egg-queue-list></ul>' +
        "</div>" +
        "</div>";
      document.body.appendChild(playerEl);

      audio = new Audio();
      audio.preload = "metadata";
      audio.volume = volume;

      var titleEl = playerEl.querySelector("[data-egg-title]");
      var artistEl = playerEl.querySelector("[data-egg-artist]");
      var playBtn = playerEl.querySelector("[data-egg-play]");
      var seek = playerEl.querySelector("[data-egg-seek]");
      var curEl = playerEl.querySelector("[data-egg-cur]");
      var durEl = playerEl.querySelector("[data-egg-dur]");
      var repeatBtn = playerEl.querySelector("[data-egg-repeat]");
      var volumeBtn = playerEl.querySelector("[data-egg-volume-btn]");
      var volumePopover = playerEl.querySelector("[data-egg-volume-popover]");
      var volumeSlider = playerEl.querySelector("[data-egg-volume]");
      var queueBtn = playerEl.querySelector("[data-egg-queue]");
      var queuePanel = playerEl.querySelector("[data-egg-queue-panel]");
      var queueList = playerEl.querySelector("[data-egg-queue-list]");
      var seeking = false;

      function paintMeta() {
        var t = tracks[index] || tracks[0];
        if (!t) return;
        titleEl.textContent = t.title;
        artistEl.textContent = t.artist || " ";
        artistEl.hidden = !t.artist;
      }

      function paintActiveInQueue() {
        var rows = queueList.querySelectorAll("[data-egg-track]");
        for (var i = 0; i < rows.length; i++) {
          var isActive = String(i) === String(index);
          rows[i].classList.toggle("is-active", isActive);
          rows[i].setAttribute("aria-current", isActive ? "true" : "false");
        }
      }

      function buildQueue() {
        queueList.innerHTML = "";
        tracks.forEach(function (t, i) {
          var li = document.createElement("li");
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "egg-music-queue-item";
          btn.setAttribute("data-egg-track", String(i));
          btn.innerHTML =
            '<span class="egg-music-queue-index" aria-hidden="true">' +
            (i + 1) +
            "</span>" +
            '<span class="egg-music-queue-text">' +
            '<span class="egg-music-queue-name"></span>' +
            '<span class="egg-music-queue-artist"></span>' +
            "</span>" +
            '<span class="egg-music-queue-eq" aria-hidden="true"><i></i><i></i><i></i></span>';
          btn.querySelector(".egg-music-queue-name").textContent = t.title;
          var qa = btn.querySelector(".egg-music-queue-artist");
          qa.textContent = t.artist || "";
          qa.hidden = !t.artist;
          btn.addEventListener("click", function () {
            var i2 = parseInt(btn.getAttribute("data-egg-track"), 10) || 0;
            loadTrack(i2, true);
          });
          li.appendChild(btn);
          queueList.appendChild(li);
        });
        paintActiveInQueue();
      }

      function setQueueOpen(open) {
        queuePanel.hidden = !open;
        queueBtn.setAttribute("aria-pressed", open ? "true" : "false");
        queueBtn.classList.toggle("is-active", open);
        if (open && collapsed) {
          collapsed = false;
          playerEl.classList.remove("is-collapsed");
          persistCollapsed();
        }
      }

      function setPlayUi(playing) {
        playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
        playBtn.innerHTML = svgIcon(playing ? ICON_PAUSE : ICON_PLAY);
      }

      function paintRepeat() {
        repeatBtn.classList.toggle("is-active", repeatMode !== "off");
        repeatBtn.classList.toggle("is-one", repeatMode === "one");
        audio.loop = repeatMode === "one";
        var label =
          repeatMode === "off"
            ? "Repeat off"
            : repeatMode === "one"
              ? "Repeat one"
              : "Repeat all";
        repeatBtn.setAttribute("aria-label", label);
        repeatBtn.title = label;
      }

      function paintVolume() {
        var muted = volume <= 0;
        volumeSlider.value = String(Math.round(volume * 100));
        volumeBtn.innerHTML = svgIcon(muted ? ICON_MUTED : ICON_VOLUME);
        volumeBtn.setAttribute("aria-label", muted ? "Muted — adjust volume" : "Volume");
        volumeBtn.title = muted ? "Muted" : "Volume " + Math.round(volume * 100) + "%";
      }

      function setVolumePopover(open) {
        volumePopover.hidden = !open;
        volumeBtn.setAttribute("aria-expanded", open ? "true" : "false");
        volumeBtn.classList.toggle("is-active", open);
        if (open) volumeSlider.focus();
      }

      function loadTrack(i, autoplay) {
        if (!tracks.length) return;
        index = ((i % tracks.length) + tracks.length) % tracks.length;
        var t = tracks[index];
        paintMeta();
        paintActiveInQueue();
        audio.src = t.src;
        audio.load();
        setPlayUi(false);
        if (autoplay) {
          var p = audio.play();
          if (p && typeof p.then === "function") {
            p.then(function () {
              setPlayUi(true);
            }).catch(function () {
              setPlayUi(false);
            });
          }
        }
      }

      playBtn.addEventListener("click", function () {
        if (audio.paused) {
          var p = audio.play();
          if (p && typeof p.then === "function") {
            p.then(function () {
              setPlayUi(true);
            }).catch(function () {});
          } else {
            setPlayUi(true);
          }
        } else {
          audio.pause();
          setPlayUi(false);
        }
      });
      playerEl.querySelector("[data-egg-prev]").addEventListener("click", function () {
        // Spotify-style: restart current track if past 3s, else go to previous.
        if (audio.currentTime > 3) {
          audio.currentTime = 0;
          return;
        }
        loadTrack(index - 1, true);
      });
      playerEl.querySelector("[data-egg-next]").addEventListener("click", function () {
        loadTrack(index + 1, true);
      });
      repeatBtn.addEventListener("click", function () {
        repeatMode =
          repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
        persistRepeat();
        paintRepeat();
      });
      volumeBtn.addEventListener("click", function () {
        setVolumePopover(volumePopover.hidden);
      });
      volumeSlider.addEventListener("input", function () {
        volume = Math.max(0, Math.min(1, Number(volumeSlider.value) / 100));
        audio.volume = volume;
        persistVolume();
        paintVolume();
      });
      queueBtn.addEventListener("click", function () {
        setQueueOpen(queuePanel.hidden);
      });
      playerEl.querySelector("[data-egg-collapse]").addEventListener("click", function () {
        collapsed = !collapsed;
        playerEl.classList.toggle("is-collapsed", collapsed);
        persistCollapsed();
        if (collapsed) setQueueOpen(false);
        if (collapsed) setVolumePopover(false);
        playerEl.querySelector("[data-egg-collapse]").setAttribute(
          "aria-label",
          collapsed ? "Expand player" : "Collapse player",
        );
      });
      playerEl.querySelector("[data-egg-expand]").addEventListener("click", function () {
        collapsed = false;
        playerEl.classList.remove("is-collapsed");
        persistCollapsed();
        playerEl.querySelector("[data-egg-collapse]").setAttribute("aria-label", "Collapse player");
      });
      playerEl.querySelector("[data-egg-close]").addEventListener("click", function () {
        audio.pause();
        setPlayUi(false);
        playerEl.hidden = true;
        // Fully dismiss: back to a clean start — unlock cleared, spam logo again.
        clearUnlock();
      });

      seek.addEventListener("pointerdown", function () {
        seeking = true;
      });
      seek.addEventListener("pointerup", function () {
        seeking = false;
        if (audio.duration) {
          audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
        }
      });
      seek.addEventListener("change", function () {
        if (audio.duration) {
          audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
        }
      });

      audio.addEventListener("timeupdate", function () {
        if (seeking || !audio.duration) return;
        seek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
        curEl.textContent = fmtTime(audio.currentTime);
        durEl.textContent = fmtTime(audio.duration);
      });
      audio.addEventListener("loadedmetadata", function () {
        durEl.textContent = fmtTime(audio.duration);
      });
      audio.addEventListener("ended", function () {
        // repeat "one" handled by audio.loop; here cover off / all.
        if (repeatMode === "one") return;
        var isLast = index >= tracks.length - 1;
        if (isLast && repeatMode === "off") {
          setPlayUi(false);
          return;
        }
        loadTrack(index + 1, true);
      });
      audio.addEventListener("play", function () {
        setPlayUi(true);
        playerEl.classList.add("is-playing");
      });
      audio.addEventListener("pause", function () {
        setPlayUi(false);
        playerEl.classList.remove("is-playing");
      });

      buildQueue();
      paintRepeat();
      paintVolume();
      playerEl._eggLoad = loadTrack;
      loadTrack(0, false);
      return playerEl;
    }

    function showPlayer(autoplay) {
      persistUnlock();
      var el = ensurePlayer();
      el.hidden = false;
      el.classList.toggle("is-collapsed", collapsed);
      if (autoplay && el._eggLoad) el._eggLoad(index, true);
    }

    // Only restore the player if still unlocked (X clears unlock completely).
    if (unlocked) {
      showPlayer(false);
    }

    if (eggMusicBound) return;
    eggMusicBound = true;

    function onLogoActivate(e) {
      if (e && e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
      if (e && e.type === "keydown") e.preventDefault();
      if (!enabled || !tracks.length) return;

      if (isUnlocked()) {
        unlocked = true;
        var el = ensurePlayer();
        if (el.hidden) {
          showPlayer(true);
          return;
        }
        collapsed = !collapsed;
        el.classList.toggle("is-collapsed", collapsed);
        persistCollapsed();
        return;
      }

      clicks += 1;
      if (clicks >= need) {
        clicks = 0;
        showPlayer(true);
      }
    }

    document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest(".site-footer .brand-logo.lg") : null;
      if (!t) return;
      onLogoActivate(e);
    });
    document.addEventListener("keydown", function (e) {
      var t = e.target && e.target.closest ? e.target.closest(".site-footer .brand-logo.lg") : null;
      if (!t) return;
      onLogoActivate(e);
    });
  }
  // ===== END EASTER_EGG_MUSIC =====

  function slideshowIntervalMs(content) {
    var raw = content && content.site && content.site.slideshowSeconds;
    var sec = parseFloat(raw);
    if (!isFinite(sec) || sec < 0.5) sec = 2;
    if (sec > 30) sec = 30;
    return Math.round(sec * 1000);
  }

  /** Idle ms before alumni auto-scroll resumes after arrows / detail sheet. */
  function alumniIdleMs(content) {
    var raw = content && content.site && content.site.alumniIdleSeconds;
    var sec = parseFloat(raw);
    if (!isFinite(sec) || sec < 1) sec = 5;
    if (sec > 120) sec = 120;
    return Math.round(sec * 1000);
  }

  /** Manual arrow swipe duration (ms). Lower = faster. */
  function alumniStepMs(content) {
    var raw = content && content.site && content.site.alumniStepMs;
    var ms = parseFloat(raw);
    if (!isFinite(ms) || ms < 100) ms = 180;
    if (ms > 800) ms = 800;
    return Math.round(ms);
  }

  /**
   * Shared swipe physics helper (highlight slideshows + alumni).
   * Tracks recent pointer samples → velocity in px/ms (positive = moved right).
   */
  function makeSwipeVelocity() {
    var samples = [];
    return {
      clear: function () {
        samples = [];
      },
      sample: function (clientX) {
        var t = performance.now();
        samples.push({ x: clientX, t: t });
        while (samples.length > 8) samples.shift();
        while (samples.length > 2 && t - samples[0].t > 120) samples.shift();
      },
      pxPerMs: function () {
        if (samples.length < 2) return 0;
        var a = samples[0];
        var b = samples[samples.length - 1];
        var dt = b.t - a.t;
        if (dt < 10) return 0;
        return (b.x - a.x) / dt;
      },
    };
  }

  /**
   * Once a highlight claims a horizontal swipe, block page touch-scrolling
   * for the rest of the gesture. Uses document touchmove preventDefault only —
   * no position:fixed / scroll restore (that jumped the page to the top).
   */
  var swipeScrollBlockTouch = null;
  function lockSwipePageScroll() {
    if (swipeScrollBlockTouch) return;
    swipeScrollBlockTouch = function (e) {
      if (e.cancelable) e.preventDefault();
    };
    document.addEventListener("touchmove", swipeScrollBlockTouch, {
      passive: false,
    });
  }
  function unlockSwipePageScroll() {
    if (!swipeScrollBlockTouch) return;
    document.removeEventListener("touchmove", swipeScrollBlockTouch);
    swipeScrollBlockTouch = null;
  }

  function mountSlideshow(container, slides, options) {
    options = options || {};
    var intervalMs = options.intervalMs || 2000;
    var emptyHtml = options.emptyHtml || "";
    var slideClass = options.slideClass || "slideshow-slide";
    var hideWhenEmpty = options.hideWhenEmpty || null;
    var captionBelow = !!options.captionBelow;
    var stageClass = options.stageClass ? " " + options.stageClass : "";

    if (!container) return;
    if (!slides.length) {
      if (hideWhenEmpty) hideWhenEmpty.style.display = "none";
      container.innerHTML = emptyHtml;
      return;
    }
    if (hideWhenEmpty) hideWhenEmpty.style.display = "";

    var index = 0;
    var timer = null;
    var transitioning = false;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function slideHtml(slide, i) {
      var hitIndex = i % slides.length;
      // Only the first real slide (and its seamless clone) get a real src up front.
      // Other slides use data-src until nearby — avoids downloading every multi‑MB photo on load.
      var isEager = hitIndex === 0;
      var slideSrc = safeMediaUrl(slide.src);
      var srcAttr = !slideSrc
        ? 'src="" alt=""'
        : isEager
          ? 'src="' + escapeHtml(slideSrc) + '"'
          : 'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" data-src="' +
            escapeHtml(slideSrc) +
            '"';
      var loading = isEager ? "eager" : "lazy";
      var prio = isEager && i === 0 ? ' fetchpriority="high"' : "";
      var img =
        "<img " +
        srcAttr +
        ' alt="' +
        escapeHtml(slide.alt || "") +
        '" class="' +
        escapeHtml(slideClass) +
        '" loading="' +
        loading +
        '" decoding="async"' +
        prio +
        ">";
      var caption =
        !captionBelow && slide.caption
          ? '<div class="slideshow-caption">' + escapeHtml(slide.caption) + "</div>"
          : "";
      var media = "";
      if (typeof slide.onClick === "function") {
        media =
          '<button type="button" class="slideshow-hit" data-slide-hit="' +
          hitIndex +
          '" aria-label="' +
          escapeHtml(slide.alt || slide.caption || "View slide") +
          '">' +
          img +
          caption +
          "</button>";
      } else if (safeUrl(slide.href)) {
        media =
          '<a href="' +
          escapeHtml(safeUrl(slide.href)) +
          '" draggable="false" aria-label="' +
          escapeHtml(slide.alt || slide.caption || "Open slide link") +
          '">' +
          img +
          caption +
          "</a>";
      } else {
        media = img + caption;
      }
      return (
        '<div class="slideshow-item" data-slide="' +
        hitIndex +
        '">' +
        media +
        "</div>"
      );
    }

    // Clones on both ends: [last] + slides + [first] for seamless wrap either way.
    var nSlides = slides.length;
    var trackHtmlParts = [];
    if (nSlides > 1) trackHtmlParts.push(slideHtml(slides[nSlides - 1], nSlides - 1));
    slides.forEach(function (slide, i) {
      trackHtmlParts.push(slideHtml(slide, i));
    });
    if (nSlides > 1) trackHtmlParts.push(slideHtml(slides[0], 0));

    container.innerHTML =
      '<div class="slideshow' +
      (captionBelow ? " slideshow-caption-below" : "") +
      '">' +
      '<div class="slideshow-stage' +
      stageClass +
      '">' +
      (nSlides > 1
        ? '<button type="button" class="slideshow-arrow prev" aria-label="Previous slide">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          "</button>"
        : "") +
      '<div class="slideshow-viewport">' +
      '<div class="slideshow-track">' +
      trackHtmlParts.join("") +
      "</div></div>" +
      (nSlides > 1
        ? '<button type="button" class="slideshow-arrow next" aria-label="Next slide">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          "</button>"
        : "") +
      '<div class="dots" aria-hidden="true">' +
      slides
        .map(function (_, i) {
          return '<span class="dot' + (i === 0 ? " on" : "") + '" data-dot="' + i + '"></span>';
        })
        .join("") +
      "</div></div>" +
      (captionBelow
        ? '<div class="slideshow-caption-bar"><p class="slideshow-title" data-slideshow-title></p></div>'
        : "") +
      "</div>";

    var track = container.querySelector(".slideshow-track");
    var dots = container.querySelectorAll("[data-dot]");
    var titleEl = container.querySelector("[data-slideshow-title]");
    var prevBtn = container.querySelector(".slideshow-arrow.prev");
    var nextBtn = container.querySelector(".slideshow-arrow.next");
    // Visual positions: 0 = clone(last), 1..n = real, n+1 = clone(first). Start on real[0].
    var visualIndex = nSlides > 1 ? 1 : 0;
    var trackCount = nSlides > 1 ? nSlides + 2 : nSlides;

    function visualPosFor(logical) {
      return nSlides > 1 ? logical + 1 : logical;
    }

    if (track) {
      track.style.setProperty("--slide-count", String(trackCount));
    }

    function hydrateNear(center) {
      var want = {};
      [center - 1, center, center + 1].forEach(function (n) {
        var i = ((n % slides.length) + slides.length) % slides.length;
        want[i] = true;
      });
      container.querySelectorAll("img[data-src]").forEach(function (img) {
        var item = img.closest(".slideshow-item");
        var hit = item ? parseInt(item.getAttribute("data-slide"), 10) : -1;
        if (!want[hit]) return;
        var real = img.getAttribute("data-src");
        if (!real) return;
        img.setAttribute("src", real);
        img.removeAttribute("data-src");
      });
    }

    function syncTitle() {
      if (!titleEl) return;
      var caption = (slides[index] && slides[index].caption) || "";
      titleEl.textContent = caption;
      titleEl.style.display = caption ? "" : "none";
    }

    function syncDots() {
      dots.forEach(function (el, i) {
        el.classList.toggle("on", i === index);
      });
    }

    function setTrack(pos, animate) {
      if (!track || !trackCount) return;
      if (reduceMotion || !animate) {
        track.classList.add("is-instant");
      } else {
        track.classList.remove("is-instant");
      }
      // Each slide is 100/trackCount of the track; shift by one slide per step.
      var pct = (pos * 100) / trackCount;
      track.style.transform = "translate3d(-" + pct + "%,0,0)";
      visualIndex = pos;
    }

    function snapOffClones() {
      if (nSlides < 2) return;
      // Landed on clone(first) → real first; clone(last) → real last.
      if (visualIndex === nSlides + 1) setTrack(1, false);
      else if (visualIndex === 0) setTrack(nSlides, false);
    }

    function goTo(next, opts) {
      opts = opts || {};
      if (!track || nSlides < 2) return;
      // Autopause while a slide is animating — only forced steps (arrows/swipe) interrupt.
      if (transitioning && !opts.force) return;

      var target = ((next % nSlides) + nSlides) % nSlides;
      var animate = !reduceMotion && opts.animate !== false;

      snapOffClones();

      // Forward wrap: last → first via trailing clone, then snap.
      if (animate && index === nSlides - 1 && target === 0) {
        index = 0;
        syncDots();
        syncTitle();
        hydrateNear(0);
        transitioning = true;
        setTrack(nSlides + 1, true);
        return;
      }

      // Backward wrap: first → last via leading clone, then snap.
      if (animate && index === 0 && target === nSlides - 1) {
        index = nSlides - 1;
        syncDots();
        syncTitle();
        hydrateNear(index);
        transitioning = true;
        setTrack(0, true);
        return;
      }

      if (target === index && visualIndex === visualPosFor(target)) return;

      index = target;
      syncDots();
      syncTitle();
      hydrateNear(target);
      transitioning = animate;
      setTrack(visualPosFor(target), animate);
      if (!animate) transitioning = false;
    }

    function onTransitionEnd(e) {
      if (!track || e.target !== track) return;
      if (e.propertyName && e.propertyName.indexOf("transform") === -1) return;
      transitioning = false;
      snapOffClones();
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      stop();
      if (nSlides < 2) return;
      timer = setInterval(function () {
        // Never force — skip ticks that would cut an in-flight swipe/arrow anim.
        goTo(index + 1, {});
      }, intervalMs);
    }

    function step(dir) {
      goTo(index + (dir > 0 ? 1 : -1), { force: true });
      start();
    }

    if (track) {
      track.addEventListener("transitionend", onTransitionEnd);
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        step(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        step(1);
      });
    }

    // Pointer drag (touch + mouse): axis-lock, rubber-band at ends, fling physics.
    var viewport = container.querySelector(".slideshow-viewport") || container;
    var drag = null;
    var suppressClick = false;
    var swipeVel = makeSwipeVelocity();
    /** Fling speed (px/s) to advance even if distance is short. */
    var SLIDE_FLING_PX_S = 520;

    function paintDrag(basePos, dxPx) {
      if (!track || !trackCount) return;
      var vw = viewport.clientWidth || 1;
      // Rubber-band only past the outer clones.
      var resisted = dxPx;
      if (basePos <= 0 && dxPx > 0) resisted = dxPx * 0.32;
      else if (basePos >= trackCount - 1 && dxPx < 0) resisted = dxPx * 0.32;
      var dragSlides = resisted / vw;
      var visual = basePos - dragSlides;
      track.classList.add("is-instant");
      track.style.transform =
        "translate3d(-" + visual * (100 / trackCount) + "%,0,0)";
    }

    function endDrag(e) {
      if (!drag) return;
      if (e && e.pointerId != null && e.pointerId !== drag.pointerId) return;
      // Prefer move-path distance over pointerup clientX — on some phones the
      // lift event reports 0 / stale X, which flipped backward swipes into next.
      var dx =
        typeof drag.lastDx === "number"
          ? drag.lastDx
          : e
            ? e.clientX - drag.startX
            : 0;
      var dy =
        typeof drag.lastDy === "number"
          ? drag.lastDy
          : e
            ? e.clientY - drag.startY
            : 0;
      var peakDx = typeof drag.peakDx === "number" ? drag.peakDx : dx;
      // Direction from farthest travel during the gesture (finger can rebound).
      var dirDx =
        Math.abs(peakDx) >= Math.max(Math.abs(dx), 1) ? peakDx : dx;
      var axis = drag.axis;
      var moved = drag.moved;
      var pointerId = drag.pointerId;
      var captured = drag.captured;
      var hitEl = drag.hitEl;
      // Only sample lift if it looks sane vs the drag path (ignore 0/stale).
      if (
        e &&
        typeof e.clientX === "number" &&
        Math.abs(e.clientX - drag.startX - dx) < 80
      ) {
        swipeVel.sample(e.clientX);
      }
      var vx = swipeVel.pxPerMs(); // px/ms
      // Force velocity to agree with gesture direction.
      if (Math.abs(dirDx) > 8 && Math.sign(vx) && Math.sign(dirDx) !== Math.sign(vx)) {
        vx = Math.sign(dirDx) * Math.abs(vx);
      }
      var speed = Math.abs(vx) * 1000; // px/s
      drag = null;
      viewport.classList.remove("is-dragging");
      unlockSwipePageScroll();
      if (captured) {
        try {
          if (pointerId != null) viewport.releasePointerCapture(pointerId);
        } catch (err) {
          /* ignore */
        }
      }
      if (axis !== "x") {
        // Tap (no horizontal drag): open lightbox/details.
        // Don't rely only on click — pointer handling can swallow it on mobile.
        if (hitEl && Math.abs(dx) < 12 && Math.abs(dy) < 12) {
          if (openSlideHit(hitEl)) suppressClick = true;
        }
        start();
        return;
      }
      if (moved) suppressClick = true;
      var vw = viewport.clientWidth || 1;
      var distThreshold = Math.max(40, vw * 0.12);
      var byDistance = Math.abs(dirDx) >= distThreshold;
      var fling = !reduceMotion && speed >= SLIDE_FLING_PX_S;
      // Finger left (dirDx < 0) → next; finger right → previous.
      var dir = 0;
      if (byDistance) {
        dir = dirDx < 0 ? 1 : -1;
      } else if (fling) {
        dir = vx < 0 ? 1 : vx > 0 ? -1 : 0;
      } else if (Math.abs(dirDx) > 8 && Math.abs(vx) < 0.02) {
        // Short intentional nudge with no usable velocity sample.
        dir = dirDx < 0 ? 1 : -1;
      }
      if (dir) {
        step(dir);
      } else {
        setTrack(visualPosFor(index), !reduceMotion);
        start();
      }
      swipeVel.clear();
    }

    if (nSlides > 1 && viewport) {
      viewport.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (e.target.closest && e.target.closest(".slideshow-arrow, .dot")) return;
        snapOffClones();
        stop();
        swipeVel.clear();
        swipeVel.sample(e.clientX);
        drag = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          lastDx: 0,
          lastDy: 0,
          peakDx: 0,
          base: visualIndex,
          axis: null,
          moved: false,
          captured: false,
          // Remember hit target so a tap can open details even if click is odd.
          hitEl:
            (e.target.closest &&
              e.target.closest("[data-slide-hit], .slideshow-item a")) ||
            null,
        };
        // Do NOT setPointerCapture yet — that steals clicks from hit buttons.
      });

      viewport.addEventListener(
        "pointermove",
        function (e) {
          if (!drag || e.pointerId !== drag.pointerId) return;
          var dx = e.clientX - drag.startX;
          var dy = e.clientY - drag.startY;
          drag.lastDx = dx;
          drag.lastDy = dy;
          if (Math.abs(dx) >= Math.abs(drag.peakDx)) drag.peakDx = dx;
          if (!drag.axis) {
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
            drag.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
            if (drag.axis === "y") {
              // Vertical intent: let the page scroll; abandon drag.
              drag = null;
              viewport.classList.remove("is-dragging");
              unlockSwipePageScroll();
              swipeVel.clear();
              start();
              return;
            }
            // Horizontal claimed — freeze page scroll for the rest of the gesture
            // (same feel as Where we are now: vertical finger drift won’t scroll).
            viewport.classList.add("is-dragging");
            lockSwipePageScroll();
            drag.hitEl = null;
            if (!drag.captured) {
              drag.captured = true;
              try {
                viewport.setPointerCapture(e.pointerId);
              } catch (err) {
                /* ignore */
              }
            }
          }
          if (drag.axis === "x") {
            if (e.cancelable) e.preventDefault();
            // Only horizontal delta drives the track (ignore vertical wobble).
            drag.moved = Math.abs(dx) > 8;
            swipeVel.sample(e.clientX);
            paintDrag(drag.base, dx);
          }
        },
        { passive: false },
      );

      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);
      // If the tab loses the pointer, always restore page scroll.
      viewport.addEventListener("lostpointercapture", function () {
        if (!drag) unlockSwipePageScroll();
      });

      // Kill click after a real horizontal drag (hit buttons / sponsor links).
      viewport.addEventListener(
        "click",
        function (e) {
          if (!suppressClick) return;
          suppressClick = false;
          e.preventDefault();
          e.stopPropagation();
        },
        true,
      );
    }

    function openSlideHit(el) {
      if (!el) return false;
      var hit = el.closest ? el.closest("[data-slide-hit]") : null;
      if (hit) {
        var i = parseInt(hit.getAttribute("data-slide-hit"), 10) || 0;
        var slide = slides[i];
        if (slide && typeof slide.onClick === "function") {
          slide.onClick(slide, i);
          return true;
        }
      }
      return false;
    }

    container.querySelectorAll("[data-slide-hit]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        if (suppressClick) return;
        e.preventDefault();
        openSlideHit(btn);
      });
    });

    setTrack(visualIndex, false);
    syncTitle();
    hydrateNear(0);
    hydrateNear(nSlides > 1 ? nSlides - 1 : 0);
    container.addEventListener("mouseenter", stop);
    container.addEventListener("mouseleave", function () {
      if (!drag) start();
    });
    start();
  }

  function dotsPlaceholder(count, extraClass) {
    count = count || 3;
    var html =
      '<div class="dots' +
      (extraClass ? " " + extraClass : "") +
      '" aria-hidden="true">';
    for (var i = 0; i < count; i++) {
      html += '<span class="dot' + (i === 0 ? " on" : "") + '"></span>';
    }
    return html + "</div>";
  }

  function normalizeGalleryItems(list) {
    return (list || [])
      .map(function (item) {
        if (!item) return null;
        if (typeof item === "string") return { image: item, link: "", name: "", visible: "yes" };
        if (!isContentVisible(item)) return null;
        return {
          image: item.image || "",
          link: item.link || "",
          name: item.name || item.title || item.caption || "",
          visible: item.visible,
        };
      })
      .filter(function (item) {
        return item && item.image;
      });
  }

  function renderHome(content) {
    var home = content.home || {};
    var links = content.links || {};
    var welcome = (home.heroWelcome || "").trim();
    var title = (home.heroTitle || "").trim();
    var brief = (home.heroBrief || "").trim();
    var introEl = document.getElementById("home-hero-intro");
    if (introEl) {
      if (!welcome && !title && !brief) {
        introEl.classList.add("hidden");
      } else {
        introEl.classList.remove("hidden");
        setText("#home-hero-welcome", welcome);
        setText("#home-hero-title", title);
        setText("#home-hero-brief", brief);
        var welcomeEl = document.getElementById("home-hero-welcome");
        var titleEl = document.getElementById("home-hero-title");
        var briefEl = document.getElementById("home-hero-brief");
        if (welcomeEl) welcomeEl.classList.toggle("hidden", !welcome);
        if (titleEl) titleEl.classList.toggle("hidden", !title);
        if (briefEl) briefEl.classList.toggle("hidden", !brief);
      }
    }
    var heroHost = document.getElementById("home-hero");
    if (heroHost) {
      var existingHero = heroHost.querySelector("img.home-hero-img");
      if (home.heroImage && existingHero) {
        if (existingHero.getAttribute("src") !== home.heroImage) {
          existingHero.setAttribute("src", home.heroImage);
        }
        existingHero.setAttribute("alt", "Auburn VSA group photo");
        existingHero.setAttribute("width", "2560");
        existingHero.setAttribute("height", "1120");
      } else {
        heroHost.innerHTML = placeholder(
          home.heroImage || "",
          "Group Photo",
          "w-full home-hero-img",
          "navy",
          "Auburn VSA group photo",
          { eager: true, width: 2560, height: 1120 },
        );
      }
    }
    setText("#home-about", home.aboutText || "");
    setBrandHeading("#home-about-heading", home.aboutHeading, "About | Auburn VSA");
    setBrandHeading("#home-whyjoin-heading", home.whyJoinHeading, "Why | Join VSA|?");
    setBrandHeading("#home-instagram-heading", home.instagramHeading, "Latest from | @auburnvsa");
    setText("#home-instagram-subtext", home.instagramSubtext || "");
    setBrandHeading("#home-alumni-heading", home.alumniHeading, "Where we are | now");
    setText("#home-alumni-subtext", home.alumniSubtext || "");
    setBrandHeading(
      "#home-cta-heading",
      home.ctaHeading,
      "Find your |community|. Celebrate your |culture|. Make lasting |memories|.",
    );
    setHref("#home-learn-more", links.learnMore || "/executive-board");
    setText("#home-cta-text", home.ctaText || "");
    var joinUrl = safeUrl(links.join || "") || "https://auburn.campuslabs.com/engage/organization/vsa";
    var igUrl = socialHref(content, "instagram") || "https://www.instagram.com/auburnvsa";
    setHref("#home-join", joinUrl);
    setHref("#home-hero-join", joinUrl);
    setHref("#home-about-join", joinUrl);
    setHref("#home-whyjoin-join", joinUrl);
    setHref("#home-howto-join", joinUrl);
    setHref("#home-join-ig", igUrl);
    setHref("#home-hero-ig", igUrl);
    setHref("#home-instagram-more", igUrl);

    setText("#home-hero-join", home.heroJoinLabel || "Join VSA on AUinvolve");
    setText("#home-hero-ig", home.heroIgLabel || "Follow on Instagram");
    setText("#home-about-join", home.aboutJoinLabel || "Join on AUinvolve");
    setText("#home-learn-more", home.aboutBoardLabel || "Meet the Executive Board");
    setText("#home-whyjoin-join", home.whyJoinCtaLabel || "Join on AUinvolve");
    setText("#home-howto-join", home.howToJoinCtaLabel || "Join Now on AUinvolve");
    setText("#home-howto-faqs", home.howToJoinFaqsLabel || "More FAQs");
    setText("#home-instagram-more", home.instagramButtonLabel || "Open Instagram");
    setText("#home-join", home.ctaJoinLabel || "Join Now on AUinvolve");
    setText("#home-join-ig", home.ctaIgLabel || "Follow @auburnvsa");
    setText("#next-up-label", home.nextUpLabel || "Next up");
    setText("#next-up-details", home.nextUpDetailsLabel || "Event details");
    setText("#next-up-ics", home.nextUpIcsLabel || "Download .ics");

    var pathHint = (home.joinPathHint || "").trim();
    var pathEl = document.getElementById("home-join-path");
    if (pathEl) {
      if (pathHint) {
        pathEl.textContent = pathHint;
        pathEl.classList.remove("hidden");
        pathEl.removeAttribute("hidden");
      } else {
        pathEl.textContent = "";
        pathEl.classList.add("hidden");
        pathEl.setAttribute("hidden", "hidden");
      }
    }

    renderHowToJoin(home);
    renderStickyJoin(home, joinUrl);

    renderNextUp(content);
    renderInstagram(home, content);
    renderAlumni(home, content);

    // Recent Events: events marked Show on home = yes (date-sorted)
    var homeEvents = sortEventsByDate(
      ((content.events && content.events.upcoming) || []).filter(function (ev) {
        return (
          ev &&
          isContentVisible(ev) &&
          (ev.showOnHome === "yes" || ev.showOnHome === true || ev.showOnHome === "Yes")
        );
      }),
    );
    var recentSlides = homeEvents
      .filter(function (ev) {
        return ev.image;
      })
      .map(function (ev) {
        return {
          src: ev.image,
          alt: ev.name || "Recent event",
          caption: ev.name || "",
          onClick: function () {
            openEventSheet(ev);
          },
        };
      });
    var recentEl = document.getElementById("home-recent");
    if (!recentEl) return;
    var slideMs = slideshowIntervalMs(content);
    if (recentSlides.length) {
      mountSlideshow(recentEl, recentSlides, {
        intervalMs: slideMs,
        slideClass: "slideshow-slide recent-slide",
        emptyHtml: "",
      });
    } else if (homeEvents.length) {
      recentEl.innerHTML =
        '<div class="recent-fill">' +
        '<div class="recent-link-list">' +
        homeEvents
          .map(function (ev, i) {
            return (
              '<button type="button" class="recent-link" data-home-event="' +
              i +
              '">' +
              escapeHtml(ev.name || "Event") +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        dotsPlaceholder(Math.min(3, homeEvents.length), "dots-bottom") +
        "</div>";
      recentEl.querySelectorAll("[data-home-event]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var i = parseInt(btn.getAttribute("data-home-event"), 10) || 0;
          openEventSheet(homeEvents[i]);
        });
      });
    } else {
      recentEl.innerHTML =
        '<div class="recent-fill">' +
        '<p class="recent-empty">' +
        escapeHtml(
          (home.recentEmptyText || "").trim() ||
            "Upcoming events will show up here soon. Follow us on Instagram for the latest.",
        ) +
        "</p>" +
        "</div>";
    }

    var orgItems = normalizeGalleryItems(home.galleryImages);
    var orgAlbum = orgItems.map(function (item) {
      return { src: item.image, link: item.link || "", name: item.name || "" };
    });
    var orgSlides = orgItems.map(function (item, i) {
      return {
        src: item.image,
        alt: item.name || "Organization picture",
        caption: item.name || "",
        onClick: function () {
          openGalleryLightbox("Organization pictures", orgAlbum, i);
        },
      };
    });
    mountSlideshow(document.getElementById("home-gallery"), orgSlides, {
      intervalMs: slideshowIntervalMs(content),
      slideClass: "slideshow-slide org-slide",
      captionBelow: true,
      emptyHtml:
        '<div class="org-placeholder">' +
        '<p class="org-empty-label">' +
        escapeHtml(
          (home.orgEmptyLabel || "").trim() || "Organization photos coming soon",
        ) +
        "</p>" +
        "</div>",
    });

    var whyJoin = (home.whyJoin || []).filter(isContentVisible);
    var legacyImgs = home.whyJoinImages || [];
    var cols = document.getElementById("home-whyjoin-cols");
    if (cols) {
      // One card per column: title + body + that column's photo (legacy whyJoinImages as fallback).
      cols.innerHTML = whyJoin
        .map(function (col, i) {
          var src = (col && col.image) || legacyImgs[i] || "";
          return (
            '<div class="whyjoin-col center">' +
            "<h3>" +
            escapeHtml((col && col.title) || "") +
            "</h3><p>" +
            escapeHtml((col && col.body) || "") +
            "</p>" +
            '<div class="whyjoin-col-media">' +
            placeholder(src, "", "ratio-16x9 w-full", "navy", (col && col.title) || "") +
            "</div></div>"
          );
        })
        .join("");
    }
    var imgsWrap = document.getElementById("home-whyjoin-imgs");
    if (imgsWrap) {
      imgsWrap.innerHTML = "";
      imgsWrap.classList.add("hidden");
    }
  }

  function renderTeam(content) {
    var section = document.querySelector("[data-team]");
    if (!section) return;
    var key = section.getAttribute("data-team");
    var team = content.team || {};
    var intros = team.intros || {};
    var intro =
      (intros[key] != null && String(intros[key]).trim() !== ""
        ? String(intros[key])
        : section.getAttribute("data-intro") || "") || "";
    setText(section.querySelector("[data-team-intro]"), intro);

    var pageTitles = team.pageTitles || {};
    var sectionHeadings = team.sectionHeadings || {};
    var titleFallback =
      key === "techTeam"
        ? "VSA| Tech Team"
        : key === "royaleDirectors"
          ? "AU Royale| Directors"
          : "VSA| Executive Board";
    var headingFallback =
      key === "techTeam"
        ? "Meet the |Tech Team"
        : key === "royaleDirectors"
          ? "Meet the |AU Royale Directors"
          : "Meet the |Executive Board";
    setBrandHeading(
      section.querySelector("[data-team-title]"),
      pageTitles[key],
      titleFallback,
      { orangeFirst: true },
    );
    setBrandHeading(
      section.querySelector("[data-team-heading]"),
      sectionHeadings[key],
      headingFallback,
      { highlightClass: "hl", baseClass: "" },
    );
    // Empty baseClass leaves a class="" span for the navy part — prefer no class.
    var headingEl = section.querySelector("[data-team-heading]");
    if (headingEl) {
      Array.prototype.forEach.call(headingEl.querySelectorAll('span[class=""]'), function (s) {
        s.removeAttribute("class");
      });
    }
    var cycleLabel = (team.cycleLabel || "Also meet").trim() || "Also meet";
    section.querySelectorAll("[data-team-cycle-label]").forEach(function (el) {
      el.textContent = cycleLabel;
    });

    var members = ((content.team && content.team[key]) || []).filter(function (m) {
      if (!m || typeof m !== "object") return false;
      if (!isContentVisible(m)) return false;
      var name = String(m.name || "").trim().toLowerCase();
      // Hide seed placeholders so unfinished rosters don't look broken on the public site.
      if (!name || name === "full name") return false;
      return true;
    });
    var grid = section.querySelector("[data-team-grid]");
    if (!grid) return;

    if (!members.length) {
      grid.innerHTML =
        '<p class="muted team-empty">Team roster coming soon. Check back later or follow us on Instagram.</p>';
      return;
    }

    grid.innerHTML = members
      .map(function (m, idx) {
        var bio = String(m.bio || "")
          .replace(/\r\n/g, "\n")
          .split("\n")
          .slice(0, 4)
          .join("\n")
          .trim();
        if (/^[-–—•.\s]*$/.test(bio)) bio = "";
        var role = escapeHtml(m.role || "");
        var name = escapeHtml(m.name || "");
        var email = escapeHtml(m.email || "");
        var backBody = bio
          ? '<p class="bio">' + escapeHtml(bio) + "</p>"
          : '<p class="bio">Bio coming soon.</p>';
        return (
          '<article class="member" data-member-i="' +
          idx +
          '">' +
          '<div class="member-scene" tabindex="0" role="button" aria-expanded="false" aria-label="' +
          (name || role || "Member") +
          ' — click photo for bio">' +
          '<div class="member-flip">' +
          '<div class="member-face member-front">' +
          '<div class="member-photo">' +
          placeholder(m.image || "", "", "ratio-3x4", "navy", m.name || "") +
          "</div></div>" +
          '<div class="member-face member-back" aria-hidden="true">' +
          backBody +
          "</div></div>" +
          '<div class="member-info">' +
          "<h3>" +
          role +
          '</h3><p class="name">' +
          name +
          "</p>" +
          (email
            ? '<a class="email" href="mailto:' + email + '">' + email + "</a>"
            : "") +
          '<span class="member-hint member-hint-idle">Tap photo for bio</span>' +
          '<span class="member-hint member-hint-open">Tap photo to flip back</span>' +
          "</div></div></article>"
        );
      })
      .join("");

    function setFlipped(card, open) {
      var scene = card.querySelector(".member-scene");
      var back = card.querySelector(".member-back");
      card.classList.toggle("is-flipped", !!open);
      if (scene) scene.setAttribute("aria-expanded", open ? "true" : "false");
      if (back) back.setAttribute("aria-hidden", open ? "false" : "true");
    }

    function flipCard(card) {
      if (!card) return;
      var open = card.classList.contains("is-flipped");
      grid.querySelectorAll(".member.is-flipped").forEach(function (other) {
        if (other !== card) setFlipped(other, false);
      });
      setFlipped(card, !open);
    }

    // Event delegation — more reliable than per-card listeners
    grid.onclick = function (e) {
      if (e.target.closest && e.target.closest("a.email")) {
        e.stopPropagation();
        return;
      }
      var scene = e.target.closest ? e.target.closest(".member-scene") : null;
      if (!scene || !grid.contains(scene)) return;
      e.preventDefault();
      flipCard(scene.closest(".member"));
    };

    grid.onkeydown = function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target.closest && e.target.closest("a.email")) return;
      var scene = e.target.closest ? e.target.closest(".member-scene") : null;
      if (!scene || !grid.contains(scene)) return;
      e.preventDefault();
      flipCard(scene.closest(".member"));
    };
  }

  function eventSortMeta(ev) {
    if (!ev) return { bucket: 9, key: 0 };
    var mode = String(ev.dateMode || "").toLowerCase();
    var start = String(ev.dateStart || "").trim();
    if (start) {
      var time = String(ev.timeStart || "00:00").trim() || "00:00";
      if (!/^\d{2}:\d{2}/.test(time)) time = "00:00";
      var ts = Date.parse(start + "T" + time.slice(0, 5) + ":00");
      if (!isNaN(ts)) return { bucket: 1, key: ts };
    }
    // Undated: Coming up first, then custom, then past — all after/before dated via buckets.
    if (mode === "upcoming") return { bucket: 0, key: 0 };
    if (mode === "past") return { bucket: 3, key: 0 };
    return { bucket: 2, key: 0 };
  }

  /** Soonest calendar date first; undated “Coming up” before dated; past undated last. */
  function sortEventsByDate(list) {
    return (list || [])
      .map(function (ev, i) {
        var meta = eventSortMeta(ev);
        return { ev: ev, i: i, bucket: meta.bucket, key: meta.key };
      })
      .sort(function (a, b) {
        if (a.bucket !== b.bucket) return a.bucket - b.bucket;
        if (a.key !== b.key) return a.key - b.key;
        return a.i - b.i;
      })
      .map(function (row) {
        return row.ev;
      });
  }

  function pickNextEvent(list) {
    var now = Date.now() - 60 * 60 * 1000;
    var dated = [];
    var upcoming = [];
    (list || []).forEach(function (ev) {
      if (!ev) return;
      var meta = eventSortMeta(ev);
      if (meta.bucket === 1 && meta.key >= now) dated.push({ ev: ev, key: meta.key });
      else if (meta.bucket === 0) upcoming.push(ev);
    });
    dated.sort(function (a, b) {
      return a.key - b.key;
    });
    if (dated.length) return dated[0].ev;
    if (upcoming.length) return upcoming[0];
    return sortEventsByDate(list)[0] || null;
  }

  function pad2(n) {
    n = String(n);
    return n.length < 2 ? "0" + n : n;
  }

  function eventCalendarStamp(ev, end) {
    var start = String(ev.dateStart || "").trim();
    if (!start) return "";
    var t = String((end ? ev.timeEnd : ev.timeStart) || (end ? "23:59" : "00:00")).trim();
    if (!/^\d{1,2}:\d{2}/.test(t)) t = end ? "23:59" : "12:00";
    var parts = t.split(":");
    var hh = pad2(parseInt(parts[0], 10) || 0);
    var mm = pad2(parseInt(parts[1], 10) || 0);
    return start.replace(/-/g, "") + "T" + hh + mm + "00";
  }

  function googleCalendarUrl(ev) {
    var start = eventCalendarStamp(ev, false);
    if (!start) return "";
    var end = eventCalendarStamp(ev, true) || start;
    var params =
      "action=TEMPLATE&text=" +
      encodeURIComponent(ev.name || "Auburn VSA event") +
      "&dates=" +
      encodeURIComponent(start + "/" + end) +
      "&details=" +
      encodeURIComponent(String(ev.description || "").slice(0, 800)) +
      "&location=" +
      encodeURIComponent(ev.location || "");
    return "https://calendar.google.com/calendar/render?" + params;
  }

  function downloadEventIcs(ev) {
    var start = eventCalendarStamp(ev, false);
    if (!start) return;
    var end = eventCalendarStamp(ev, true) || start;
    var ics =
      "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Auburn VSA//EN\r\nBEGIN:VEVENT\r\n" +
      "DTSTART:" +
      start +
      "\r\nDTEND:" +
      end +
      "\r\nSUMMARY:" +
      String(ev.name || "Auburn VSA").replace(/\r?\n/g, " ") +
      "\r\nDESCRIPTION:" +
      String(ev.description || "").replace(/\r?\n/g, "\\n") +
      "\r\nLOCATION:" +
      String(ev.location || "").replace(/\r?\n/g, " ") +
      "\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n";
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (ev.name || "auburn-vsa-event").replace(/[^\w\-]+/g, "-").toLowerCase() + ".ics";
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1500);
  }

  function pageShareUrl() {
    try {
      return location.href.split("#")[0];
    } catch (err) {
      return "https://www.auburnvsa.com/";
    }
  }

  function absoluteShareUrl(url) {
    var raw = String(url || "").trim();
    if (!raw) return pageShareUrl();
    try {
      return new URL(raw, location.href).href;
    } catch (err) {
      return pageShareUrl();
    }
  }

  function fallbackCopyText(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  function flashCopyButton(btn) {
    if (!btn) return;
    var prev = btn.getAttribute("data-label") || btn.textContent;
    btn.setAttribute("data-label", prev);
    btn.textContent = "Copied!";
    btn.classList.add("is-copied");
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = prev;
      btn.classList.remove("is-copied");
      btn.disabled = false;
    }, 1600);
  }

  function shareOrCopy(title, text, url) {
    var u = absoluteShareUrl(url);
    if (navigator.share) {
      navigator
        .share({ title: title || "Auburn VSA", text: text || "", url: u })
        .catch(function () {});
      return;
    }
    copyLinkOnly(u);
  }

  function copyLinkOnly(url, btn) {
    var u = absoluteShareUrl(url);
    function done() {
      flashCopyButton(btn);
    }
    function fail() {
      window.prompt("Copy this link:", u);
    }
    if (navigator.clipboard && window.isSecureContext && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(u).then(done, function () {
        if (fallbackCopyText(u)) done();
        else fail();
      });
      return;
    }
    if (fallbackCopyText(u)) done();
    else fail();
  }

  var NEXT_UP_COLLAPSED_KEY = "vsa-next-up-collapsed";

  function nextUpCollapsedStored() {
    try {
      return sessionStorage.getItem(NEXT_UP_COLLAPSED_KEY) === "1";
    } catch (err) {
      return false;
    }
  }

  function setNextUpCollapsedStored(collapsed) {
    try {
      if (collapsed) sessionStorage.setItem(NEXT_UP_COLLAPSED_KEY, "1");
      else sessionStorage.removeItem(NEXT_UP_COLLAPSED_KEY);
    } catch (err) {
      /* private mode / blocked storage */
    }
  }

  function applyNextUpCollapsed(strip, collapsed) {
    if (!strip) return;
    strip.classList.toggle("is-collapsed", !!collapsed);
    var toggle = document.getElementById("next-up-toggle");
    if (!toggle) return;
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    toggle.setAttribute(
      "aria-label",
      collapsed ? "Show next up details" : "Hide next up details",
    );
  }

  function bindNextUpToggle(strip) {
    if (!strip || strip.getAttribute("data-next-up-toggle-bound") === "1") return;
    strip.setAttribute("data-next-up-toggle-bound", "1");
    var toggle = document.getElementById("next-up-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      var next = !strip.classList.contains("is-collapsed");
      applyNextUpCollapsed(strip, next);
      setNextUpCollapsedStored(next);
    });
  }

  function renderNextUp(content) {
    var home = (content && content.home) || {};
    var nextUpLabel = (home.nextUpLabel || "").trim() || "Next up";
    var detailsLabel = (home.nextUpDetailsLabel || "").trim() || "Event details";
    var gcalLabel = (home.nextUpGcalLabel || "").trim() || "Add to Google Calendar";
    var icsLabel = (home.nextUpIcsLabel || "").trim() || "Download .ics";
    var viewEventsLabel = (home.nextUpViewEventsLabel || "").trim() || "View all events";
    var nextUpJoinLabel = (home.nextUpJoinLabel || "").trim() || "New here? Join VSA";
    var strip = document.getElementById("next-up");
    if (!strip) {
      var main = document.querySelector("main");
      if (!main) return;
      strip = document.createElement("section");
      strip.id = "next-up";
      strip.className = "next-up-strip is-empty";
      strip.setAttribute("aria-label", nextUpLabel);
      strip.innerHTML =
        '<div class="container next-up-inner">' +
        '<div class="next-up-copy">' +
        '<span class="next-up-label" id="next-up-label">' +
        escapeHtml(nextUpLabel) +
        "</span>" +
        '<strong class="next-up-title" id="next-up-title"></strong>' +
        '<span class="next-up-meta" id="next-up-meta"></span>' +
        "</div>" +
        '<div class="next-up-actions" id="next-up-actions">' +
        '<button type="button" class="btn btn-orange sm" id="next-up-details">' +
        escapeHtml(detailsLabel) +
        "</button>" +
        '<a class="btn btn-outline-navy sm" id="next-up-gcal" href="events" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(gcalLabel) +
        "</a>" +
        '<button type="button" class="btn btn-outline-navy sm" id="next-up-ics">' +
        escapeHtml(icsLabel) +
        "</button>" +
        "</div>" +
        '<button type="button" class="next-up-toggle" id="next-up-toggle" aria-expanded="true" aria-controls="next-up-actions next-up-meta" aria-label="Hide next up details">' +
        '<span class="next-up-toggle-chevron" aria-hidden="true"></span>' +
        "</button></div>";
      main.insertBefore(strip, main.firstChild);
    }
    strip.setAttribute("aria-label", nextUpLabel);
    setText("#next-up-label", nextUpLabel);
    setText("#next-up-details", detailsLabel);
    setText("#next-up-ics", icsLabel);
    var ev = pickNextEvent(
      ((content.events && content.events.upcoming) || []).filter(isContentVisible),
    );
    if (!ev) {
      strip.classList.add("is-empty", "hidden");
      strip.setAttribute("aria-hidden", "true");
      return;
    }
    strip.classList.remove("is-empty", "hidden");
    strip.removeAttribute("aria-hidden");
    setText("#next-up-title", ev.name || "Auburn VSA event");
    var meta = [ev.date, ev.location].filter(Boolean).join(" · ");
    setText("#next-up-meta", meta);
    var details = document.getElementById("next-up-details");
    if (details) {
      details.onclick = function () {
        openEventSheet(ev);
      };
    }
    var gcal = document.getElementById("next-up-gcal");
    var gUrl = googleCalendarUrl(ev);
    if (gcal) {
      if (gUrl) {
        gcal.href = gUrl;
        gcal.textContent = gcalLabel;
        gcal.classList.remove("hidden");
      } else {
        gcal.href = appUrl("/events");
        gcal.textContent = viewEventsLabel;
        gcal.classList.remove("hidden");
      }
    }
    var ics = document.getElementById("next-up-ics");
    if (ics) {
      if (ev.dateStart) {
        ics.classList.remove("hidden");
        ics.onclick = function () {
          downloadEventIcs(ev);
        };
      } else {
        ics.classList.add("hidden");
      }
    }

    // Home only: soft Join invite beside event actions.
    var actions = document.getElementById("next-up-actions");
    var joinLink = document.getElementById("next-up-join");
    var isHome = document.body && document.body.getAttribute("data-page") === "home";
    var joinUrl =
      safeUrl((content.links && content.links.join) || "") ||
      "https://auburn.campuslabs.com/engage/organization/vsa";
    if (isHome && actions && joinUrl) {
      if (!joinLink) {
        joinLink = document.createElement("a");
        joinLink.id = "next-up-join";
        joinLink.className = "btn btn-outline-navy sm";
        joinLink.target = "_blank";
        joinLink.rel = "noopener noreferrer";
        actions.appendChild(joinLink);
      }
      joinLink.href = joinUrl;
      joinLink.textContent = nextUpJoinLabel;
      joinLink.classList.remove("hidden");
    } else if (joinLink) {
      joinLink.classList.add("hidden");
    }

    applyNextUpCollapsed(strip, nextUpCollapsedStored());
    bindNextUpToggle(strip);
  }

  function renderHowToJoin(home) {
    var section = document.getElementById("home-howto-section");
    var list = document.getElementById("home-howto-steps");
    if (!section || !list) return;
    var steps = (home.howToJoinSteps || []).filter(function (s) {
      return s && isContentVisible(s) && ((s.title || "").trim() || (s.body || "").trim());
    });
    if (!steps.length) {
      section.classList.add("hidden");
      section.setAttribute("hidden", "hidden");
      list.innerHTML = "";
      return;
    }
    section.classList.remove("hidden");
    section.removeAttribute("hidden");
    var heading = (home.howToJoinHeading || "").trim() || "How to | join";
    setBrandHeading("#home-howto-heading", heading, "How to | join");
    list.innerHTML = steps
      .map(function (s, i) {
        return (
          '<li class="how-to-join-step">' +
          '<span class="how-to-join-num" aria-hidden="true">' +
          (i + 1) +
          "</span>" +
          '<div class="how-to-join-copy">' +
          "<h3></h3>" +
          "<p></p>" +
          "</div></li>"
        );
      })
      .join("");
    var items = list.querySelectorAll(".how-to-join-step");
    steps.forEach(function (s, i) {
      var item = items[i];
      if (!item) return;
      var h = item.querySelector("h3");
      var p = item.querySelector("p");
      if (h) h.textContent = (s.title || "").trim();
      if (p) {
        var body = (s.body || "").trim();
        p.textContent = body;
        p.hidden = !body;
      }
    });
  }

  var STICKY_JOIN_DISMISS_KEY = "vsa-sticky-join-dismissed";

  function renderStickyJoin(home, joinUrl) {
    var bar = document.getElementById("sticky-join");
    var link = document.getElementById("sticky-join-link");
    var dismiss = document.getElementById("sticky-join-dismiss");
    if (!bar || !link) return;
    var enabled = String(home.stickyJoin || "yes").toLowerCase() === "yes";
    var url = safeUrl(joinUrl || "");
    var dismissed = false;
    try {
      dismissed = sessionStorage.getItem(STICKY_JOIN_DISMISS_KEY) === "1";
    } catch (e) {}
    var show = enabled && !!url && !dismissed;
    if (!show) {
      bar.classList.add("hidden");
      bar.setAttribute("hidden", "hidden");
      bar.setAttribute("aria-hidden", "true");
      document.body.classList.remove("has-sticky-join");
      return;
    }
    link.href = url;
    setText(link, home.stickyJoinLabel || "Join VSA");
    bar.classList.remove("hidden");
    bar.removeAttribute("hidden");
    bar.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-sticky-join");
    if (dismiss && !dismiss._stickyJoinBound) {
      dismiss._stickyJoinBound = true;
      dismiss.addEventListener("click", function () {
        try {
          sessionStorage.setItem(STICKY_JOIN_DISMISS_KEY, "1");
        } catch (e2) {}
        bar.classList.add("hidden");
        bar.setAttribute("hidden", "hidden");
        bar.setAttribute("aria-hidden", "true");
        document.body.classList.remove("has-sticky-join");
      });
    }
  }

  function renderInstagram(home, content) {
    var section = document.getElementById("home-instagram-section");
    var grid = document.getElementById("home-instagram");
    if (!section || !grid) return;
    var posts = (home.instagramPosts || []).filter(function (p) {
      return p && isContentVisible(p) && (p.url || p.image);
    });
    if (!posts.length) {
      section.classList.add("hidden");
      return;
    }
    section.classList.remove("hidden");
    var igUrl = socialHref(content, "instagram") || "https://www.instagram.com/auburnvsa";
    setHref("#home-instagram-more", igUrl);
    grid.innerHTML = posts
      .slice(0, 6)
      .map(function (p) {
        var href = safeUrl(p.url) || igUrl;
        var igImg = safeMediaUrl(p.image);
        var img = igImg
          ? '<img src="' +
            escapeHtml(igImg) +
            '" alt="' +
            escapeHtml(p.caption || "Instagram") +
            '" loading="lazy" decoding="async">'
          : '<div class="ig-card-empty" aria-hidden="true">IG</div>';
        var cap = p.caption
          ? '<div class="ig-card-body"><p>' + escapeHtml(p.caption) + "</p></div>"
          : "";
        return (
          '<a class="ig-card" href="' +
          escapeHtml(href) +
          '" target="_blank" rel="noopener noreferrer">' +
          img +
          cap +
          "</a>"
        );
      })
      .join("");
  }

  /** Format alumni.year for public UI (grad year, not calendar year). */
  function formatAlumniGradYear(year) {
    var y = String(year || "").trim();
    if (!y) return "";
    if (/^(class of|grad)\b/i.test(y)) return y;
    if (/^\d{4}$/.test(y)) return "Class of " + y;
    return "Grad " + y;
  }

  /** Prefer jobTitle; fall back to legacy title key if present. */
  function alumniJobTitle(person) {
    if (!person || typeof person !== "object") return "";
    var jt = String(person.jobTitle || "").trim();
    if (jt) return jt;
    return String(person.title || "").trim();
  }

  /** Card subtitle: job title, else note (role/employer) so the row always shows a title line when data exists. */
  function alumniCardTitle(person) {
    var jt = alumniJobTitle(person);
    if (jt) return jt;
    return String((person && person.note) || "").trim();
  }

  /** Fisher–Yates shuffle (in place). Client-only — never persisted to content.json. */
  function shuffleInPlace(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function renderAlumni(home, content) {
    var section = document.getElementById("home-alumni-section");
    var track = document.getElementById("home-alumni");
    var carousel = document.getElementById("home-alumni-carousel");
    if (!section || !track) return;
    var people = (home.alumni || []).filter(function (p) {
      return p && isContentVisible(p) && (p.name || p.image);
    });
    if (!people.length) {
      section.classList.add("hidden");
      return;
    }
    // Randomize order each page load; card indices map into this shuffled list.
    shuffleInPlace(people);
    section.classList.remove("hidden");
    var cardsHtml = people
      .map(function (p, i) {
        var imgSrc = safeMediaUrl(p.image);
        var img = imgSrc
          ? '<img src="' +
            escapeHtml(imgSrc) +
            '" alt="' +
            escapeHtml(p.name || "Alumni") +
            '" loading="lazy" decoding="async" draggable="false">'
          : '<div class="ig-card-empty" aria-hidden="true">' +
            escapeHtml((p.name || "?").charAt(0)) +
            "</div>";
        var gradLine = formatAlumniGradYear(p.year);
        var cardTitle = alumniCardTitle(p);
        var metaBits = [];
        if (cardTitle) {
          metaBits.push(
            '<p class="alumni-card-job">' + escapeHtml(cardTitle) + "</p>",
          );
        }
        if (gradLine) {
          metaBits.push(
            '<p class="alumni-card-year">' + escapeHtml(gradLine) + "</p>",
          );
        }
        return (
          '<article class="alumni-card" role="button" tabindex="0" data-alumni-index="' +
          i +
          '" aria-label="View details for ' +
          escapeHtml(p.name || "alumni") +
          '">' +
          img +
          '<div class="alumni-card-body"><strong class="alumni-card-name">' +
          escapeHtml(p.name || "") +
          "</strong>" +
          metaBits.join("") +
          "</div></article>"
        );
      })
      .join("");
    // One set initially; bindAlumniCarousel duplicates for seamless loop when overflowing.
    track.innerHTML =
      '<div class="alumni-marquee-strip"><div class="alumni-marquee-set">' +
      cardsHtml +
      "</div></div>";
    track.setAttribute("data-alumni-count", String(people.length));
    track.setAttribute("data-alumni-copies", "1");
    if (carousel) {
      carousel._alumniPeople = people;
      carousel._alumniCardsHtml = cardsHtml;
      carousel._alumniIdleMs = alumniIdleMs(content);
      carousel._alumniStepMs = alumniStepMs(content);
    }
    bindAlumniCardClicks(track, people);
    if (carousel && typeof carousel.alumniRefreshLayout === "function") {
      carousel.alumniRefreshLayout();
      return;
    }
    bindAlumniCarousel(track);
  }

  function ensureAlumniSheet() {
    var sheet = document.querySelector("[data-alumni-sheet]");
    if (sheet) return sheet;
    sheet = document.createElement("div");
    sheet.className = "event-sheet alumni-sheet hidden";
    sheet.setAttribute("data-alumni-sheet", "");
    sheet.setAttribute("aria-hidden", "true");
    sheet.innerHTML =
      '<div class="event-sheet-backdrop" data-alumni-sheet-close tabindex="-1"></div>' +
      '<div class="event-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="alumni-sheet-title">' +
      '<header class="event-sheet-head">' +
      '<h2 id="alumni-sheet-title">Alumni</h2>' +
      '<button type="button" class="event-sheet-close" data-alumni-sheet-close aria-label="Close">&times;</button>' +
      "</header>" +
      '<div class="event-sheet-body" data-alumni-sheet-body></div>' +
      "</div>";
    document.body.appendChild(sheet);
    return sheet;
  }

  function closeAlumniSheet() {
    var sheet = document.querySelector("[data-alumni-sheet]");
    if (!sheet) return;
    markOverlayClosing(sheet);
    var eventOpen = document.querySelector("[data-event-sheet].is-open");
    var merchOpen = document.querySelector("[data-merch-sheet].is-open");
    var eventsModal = document.getElementById("events-modal");
    if (
      !(eventOpen && eventOpen.classList.contains("is-open")) &&
      !(merchOpen && merchOpen.classList.contains("is-open")) &&
      !(eventsModal && eventsModal.classList.contains("is-open"))
    ) {
      document.body.classList.remove("event-sheet-lock");
    }
    scheduleOverlayHide(sheet);
    var carousel = document.getElementById("home-alumni-carousel");
    if (carousel && typeof carousel.alumniScheduleResume === "function") {
      carousel.alumniScheduleResume();
    }
  }

  function openAlumniSheet(person) {
    if (!person) return;
    var carousel = document.getElementById("home-alumni-carousel");
    if (carousel && typeof carousel.alumniPauseAuto === "function") {
      carousel.alumniPauseAuto();
    }
    var sheet = ensureAlumniSheet();
    var title = document.getElementById("alumni-sheet-title");
    var body = sheet.querySelector("[data-alumni-sheet-body]");
    var displayName = person.name || "Alumni";
    if (title) title.textContent = "Alumni";
    if (body) {
      var personImg = safeMediaUrl(person.image);
      var imgHtml = personImg
        ? '<div class="event-sheet-media alumni-sheet-media"><img src="' +
          escapeHtml(personImg) +
          '" alt="' +
          escapeHtml(displayName) +
          '" loading="lazy" decoding="async"></div>'
        : '<div class="event-sheet-media alumni-sheet-media event-sheet-media-empty" aria-hidden="true"></div>';
      var gradLine = formatAlumniGradYear(person.year);
      var jobTitle = alumniJobTitle(person);
      var note = String(person.note || "").trim();
      var desc = String(person.description || "").trim();
      body.innerHTML =
        '<div class="alumni-sheet-layout">' +
        '<div class="alumni-sheet-aside">' +
        imgHtml +
        "</div>" +
        '<div class="alumni-sheet-copy">' +
        '<h3 id="alumni-sheet-person" class="event-sheet-name alumni-sheet-name">' +
        escapeHtml(displayName) +
        "</h3>" +
        (jobTitle
          ? '<p class="alumni-sheet-job">' + escapeHtml(jobTitle) + "</p>"
          : "") +
        (gradLine
          ? '<p class="alumni-sheet-year">' + escapeHtml(gradLine) + "</p>"
          : "") +
        (note
          ? '<p class="alumni-sheet-note">' + escapeHtml(note) + "</p>"
          : "") +
        (desc
          ? '<p class="event-sheet-desc">' + escapeHtml(desc).replace(/\n/g, "<br>") + "</p>"
          : '<p class="event-sheet-desc muted">No description yet.</p>') +
        "</div></div>";
      sheet
        .querySelector(".event-sheet-panel")
        .setAttribute("aria-labelledby", "alumni-sheet-person");
    }

    prepareOverlayOpen(sheet);
    document.body.classList.add("event-sheet-lock");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        sheet.classList.add("is-open");
      });
    });

    if (!sheet.getAttribute("data-bound")) {
      sheet.setAttribute("data-bound", "1");
      sheet.querySelectorAll("[data-alumni-sheet-close]").forEach(function (el) {
        el.addEventListener("click", closeAlumniSheet);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && sheet.classList.contains("is-open")) {
          e.preventDefault();
          closeAlumniSheet();
        }
      });
    }
  }

  function openAlumniCardFromEl(root, el) {
    if (!root || !el) return false;
    var people = root._alumniList || [];
    var i = parseInt(el.getAttribute("data-alumni-index"), 10);
    if (isNaN(i) || !people[i]) return false;
    openAlumniSheet(people[i]);
    return true;
  }

  function bindAlumniCardClicks(root, list) {
    if (!root) return;
    // Keep latest shuffled list for delegated handlers.
    root._alumniList = list || [];
    if (root.getAttribute("data-alumni-clicks") === "1") return;
    root.setAttribute("data-alumni-clicks", "1");
    // Reliable open path for mouse + keyboard. Touch/drag uses pointerup in
    // bindAlumniCarousel; that sets _alumniOpenedFromTap to avoid double-open.
    root.addEventListener("click", function (e) {
      if (root._alumniOpenedFromTap) return;
      if (root._alumniSuppressClickUntil && performance.now() < root._alumniSuppressClickUntil) {
        return;
      }
      var card = e.target.closest(".alumni-card[data-alumni-index]");
      if (!card || !root.contains(card)) return;
      e.preventDefault();
      openAlumniCardFromEl(root, card);
    });
    root.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var card = e.target.closest(".alumni-card[data-alumni-index]");
      if (!card || !root.contains(card)) return;
      e.preventDefault();
      openAlumniCardFromEl(root, card);
    });
  }

  /** Overflow margin so float rounding does not false-trigger looping. */
  var ALUMNI_OVERFLOW_MIN_PX = 8;
  /** Seamless loop speed (px/s). */
  var ALUMNI_LOOP_PX_PER_SEC = 42;
  /** Fallback manual arrow swipe duration (ms) if CMS unset. */
  var ALUMNI_STEP_MS_DEFAULT = 180;
  /**
   * Kill switch: set false to disable alumni drag-swipe immediately.
   * Or delete bindAlumniDragSwipe + its call site (search ALUMNI_DRAG_SWIPE).
   */
  var ALUMNI_ENABLE_DRAG_SWIPE = true;

  // ===== BEGIN ALUMNI_DRAG_SWIPE (safe to delete this whole function) =====
  /**
   * Pointer drag/swipe for Where we are now (touch + desktop).
   * Axis-locks horizontal; release applies inertia (friction coast).
   * Short tap still opens the alumni detail sheet.
   */
  function bindAlumniDragSwipe(api) {
    var track = api.track;
    var carousel = api.carousel;
    var tapSlop = api.tapSlopPx || 18;
    var drag = null;
    var swipeVel = makeSwipeVelocity();
    var inertiaRaf = 0;
    /** Min release speed (px/s) to start coasting. */
    var INERTIA_MIN_PX_S = 180;
    /** Cap coast speed (px/s) so flings stay readable. */
    var INERTIA_MAX_PX_S = 2800;
    /** Per-16ms velocity multiplier (lower = more friction). */
    var INERTIA_DECAY = 0.92;
    /** Stop when |v| below this (px/ms). */
    var INERTIA_STOP_PX_MS = 0.04;

    function releaseCapture(pointerId) {
      try {
        if (pointerId != null) track.releasePointerCapture(pointerId);
      } catch (err) {
        /* ignore */
      }
    }

    function cancelInertia() {
      if (inertiaRaf) {
        cancelAnimationFrame(inertiaRaf);
        inertiaRaf = 0;
      }
    }

    function openCard(card) {
      if (!card || !track.contains(card)) return;
      track._alumniOpenedFromTap = true;
      openAlumniCardFromEl(track, card);
      setTimeout(function () {
        track._alumniOpenedFromTap = false;
      }, 50);
    }

    function finishInteract() {
      track._alumniSuppressClickUntil = performance.now() + 400;
      api.onUserInteract();
    }

    /** Coast with decaying velocity (offset px/ms). Finger-right → negative offset vel. */
    function startInertia(offsetVelPxMs) {
      cancelInertia();
      var reduce =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || !isFinite(offsetVelPxMs) || Math.abs(offsetVelPxMs) < INERTIA_STOP_PX_MS) {
        api.applyOffset();
        finishInteract();
        return;
      }
      var max = INERTIA_MAX_PX_S / 1000;
      var v = Math.max(-max, Math.min(max, offsetVelPxMs));
      var last = performance.now();
      carousel.classList.add("is-coasting");

      function tick(now) {
        if (!api.isLoopEnabled()) {
          inertiaRaf = 0;
          carousel.classList.remove("is-coasting");
          finishInteract();
          return;
        }
        var dt = Math.min(34, Math.max(0, now - last));
        last = now;
        v *= Math.pow(INERTIA_DECAY, dt / 16);
        if (Math.abs(v) < INERTIA_STOP_PX_MS) {
          inertiaRaf = 0;
          carousel.classList.remove("is-coasting");
          api.applyOffset();
          finishInteract();
          return;
        }
        api.setOffset(api.getOffset() + v * dt);
        api.applyOffset();
        inertiaRaf = requestAnimationFrame(tick);
      }
      inertiaRaf = requestAnimationFrame(tick);
    }

    function endDrag(e) {
      if (!drag) return;
      if (e && e.pointerId != null && e.pointerId !== drag.pointerId) return;
      // Same as highlights: trust move-path dx, not a flaky pointerup clientX.
      var dx =
        typeof drag.lastDx === "number"
          ? drag.lastDx
          : e
            ? e.clientX - drag.startX
            : 0;
      var dy =
        typeof drag.lastDy === "number"
          ? drag.lastDy
          : e
            ? e.clientY - drag.startY
            : 0;
      var peakDx = typeof drag.peakDx === "number" ? drag.peakDx : dx;
      var dirDx =
        Math.abs(peakDx) >= Math.max(Math.abs(dx), 1) ? peakDx : dx;
      var axis = drag.axis;
      var card = drag.card;
      var base = drag.base;
      var pointerId = drag.pointerId;
      if (
        e &&
        typeof e.clientX === "number" &&
        Math.abs(e.clientX - drag.startX - dx) < 80
      ) {
        swipeVel.sample(e.clientX);
      }
      var vx = swipeVel.pxPerMs();
      drag = null;
      carousel.classList.remove("is-dragging");
      releaseCapture(pointerId);

      if (axis === "x" && api.isLoopEnabled()) {
        api.cancelStepAnim();
        api.setOffset(base - dirDx);
        api.applyOffset();
        // Coast in the overall swipe direction (dirDx), not a noisy lift velocity.
        var speed = Math.abs(vx) * 1000;
        if (Math.abs(dirDx) > 8 && Math.sign(vx) && Math.sign(dirDx) !== Math.sign(vx)) {
          vx = Math.sign(dirDx) * Math.abs(vx);
        } else if (Math.abs(vx) < 0.02 && Math.abs(dirDx) > 8) {
          vx = Math.sign(dirDx) * (INERTIA_MIN_PX_S / 1000);
          speed = INERTIA_MIN_PX_S;
        }
        // Finger right (vx > 0) decreases offset; coast that way.
        if (speed >= INERTIA_MIN_PX_S) {
          startInertia(-vx);
        } else {
          finishInteract();
        }
        swipeVel.clear();
        return;
      }

      swipeVel.clear();
      // Tap / abandoned vertical: open details if movement stayed small.
      if (card && Math.sqrt(dx * dx + dy * dy) < tapSlop) {
        openCard(card);
      }
    }

    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest && e.target.closest(".carousel-arrow")) return;
      cancelInertia();
      carousel.classList.remove("is-coasting");
      swipeVel.clear();
      swipeVel.sample(e.clientX);
      if (!api.isLoopEnabled()) {
        // Static row: keep tap-to-open only.
        var staticCard = e.target.closest(".alumni-card[data-alumni-index]");
        if (!staticCard) return;
        drag = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          lastDx: 0,
          lastDy: 0,
          peakDx: 0,
          base: 0,
          axis: null,
          card: staticCard,
          staticOnly: true,
        };
        return;
      }
      api.stopLoop();
      api.cancelStepAnim();
      drag = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastDx: 0,
        lastDy: 0,
        peakDx: 0,
        base: api.getOffset(),
        axis: null,
        card: e.target.closest(".alumni-card[data-alumni-index]") || null,
        staticOnly: false,
      };
      try {
        track.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
    });

    track.addEventListener(
      "pointermove",
      function (e) {
        if (!drag || e.pointerId !== drag.pointerId) return;
        if (drag.staticOnly) return;
        var dx = e.clientX - drag.startX;
        var dy = e.clientY - drag.startY;
        drag.lastDx = dx;
        drag.lastDy = dy;
        if (Math.abs(dx) >= Math.abs(drag.peakDx)) drag.peakDx = dx;
        if (!drag.axis) {
          if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
          drag.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
          if (drag.axis === "y") {
            var pid = drag.pointerId;
            drag = null;
            carousel.classList.remove("is-dragging");
            releaseCapture(pid);
            swipeVel.clear();
            return;
          }
          carousel.classList.add("is-dragging");
          drag.card = null; // horizontal drag — don't open sheet on release
        }
        if (drag.axis === "x") {
          if (e.cancelable) e.preventDefault();
          swipeVel.sample(e.clientX);
          api.applyVisualOffset(drag.base - dx);
        }
      },
      { passive: false },
    );

    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
  }
  // ===== END ALUMNI_DRAG_SWIPE =====

  /**
   * Alumni carousel: seamless infinite loop (2 identical sets + translate3d).
   * - RAF only writes transform; setWidth cached on layout (never measured in tick).
   * - User controls: arrows + optional drag-swipe (ALUMNI_ENABLE_DRAG_SWIPE) + card tap.
   * - Interaction pauses auto (“limp”); resumes after site.alumniIdleSeconds idle.
   * - Arrow swipe duration from site.alumniStepMs.
   * - Static/centered when a single set fits.
   */
  function bindAlumniCarousel(track) {
    var carousel = track.closest(".carousel");
    if (!carousel || carousel.getAttribute("data-carousel-bound")) return;
    carousel.setAttribute("data-carousel-bound", "1");
    var section =
      document.getElementById("home-alumni-section") ||
      carousel.closest("#home-alumni-section") ||
      carousel;
    var prev =
      carousel.querySelector(".carousel-arrow.prev") ||
      carousel.querySelector('.carousel-arrow[aria-label*="Previous"]');
    var next =
      carousel.querySelector(".carousel-arrow.next") ||
      carousel.querySelector('.carousel-arrow[aria-label*="Next"]');

    var reducedMotionQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    function prefersReducedMotion() {
      return !!(reducedMotionQuery && reducedMotionQuery.matches);
    }

    var resizeTimer = 0;
    var rafId = 0;
    var lastTs = 0;
    var idleTimer = 0;
    var loopEnabled = false;
    var sectionInView = false;
    var userPaused = false;
    var layoutBusy = false;
    /** Width of one set + inter-set gap. Cached on layout only. */
    var setWidth = 0;
    var offset = 0;
    var TAP_SLOP_PX = 18;
    var stepRafId = 0;
    var stepAnimating = false;
    var stepVisual = 0;
    var stepFrom = 0;
    var stepTo = 0;
    var stepStartedAt = 0;

    function idleResumeMs() {
      var ms = carousel._alumniIdleMs;
      // Match admin options (3–30s); fall back to 5s if unset/invalid.
      if (!isFinite(ms) || ms < 1000) ms = 5000;
      if (ms > 120000) ms = 120000;
      return ms;
    }

    function stepDurationMs() {
      var ms = carousel._alumniStepMs;
      if (!isFinite(ms) || ms < 100) ms = ALUMNI_STEP_MS_DEFAULT;
      if (ms > 800) ms = 800;
      return ms;
    }

    function alumniSheetOpen() {
      var sheet = document.querySelector("[data-alumni-sheet]");
      return !!(sheet && sheet.classList.contains("is-open"));
    }

    function clearIdle() {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = 0;
      }
    }

    function scheduleResume() {
      clearIdle();
      if (prefersReducedMotion() || !loopEnabled || alumniSheetOpen()) {
        return;
      }
      idleTimer = setTimeout(function () {
        idleTimer = 0;
        userPaused = false;
        if (sectionInView && !document.hidden && !alumniSheetOpen()) {
          startLoop();
        }
      }, idleResumeMs());
    }

    /** Pause auto and start idle timer (arrows). */
    function onUserInteract() {
      if (!loopEnabled) return;
      userPaused = true;
      stopLoop();
      scheduleResume();
    }

    /** Pause and stay limp (detail sheet open) — no idle resume until scheduleResume. */
    carousel.alumniPauseAuto = function () {
      if (!loopEnabled) return;
      userPaused = true;
      stopLoop();
      clearIdle();
    };
    /** After sheet close / interaction ends — limp until idle seconds elapse. */
    carousel.alumniScheduleResume = function () {
      if (!loopEnabled) return;
      userPaused = true;
      stopLoop();
      scheduleResume();
    };

    function getStrip() {
      return track.querySelector(".alumni-marquee-strip");
    }

    function getSets() {
      return track.querySelectorAll(".alumni-marquee-set");
    }

    function stripGapPx(strip) {
      if (!strip) return 12;
      var styles = window.getComputedStyle(strip);
      return parseFloat(styles.columnGap || styles.gap) || 12;
    }

    /**
     * Card width from live screen + carousel width (not CSS cqi alone).
     * Breakpoints match styles.css; pixel basis keeps loop setWidth accurate on phones.
     */
    function alumniCardSizePx() {
      var screenW =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        0;
      var trackW = carousel.clientWidth || track.clientWidth || screenW;
      if (!trackW) return 0;
      var rootFs =
        parseFloat(window.getComputedStyle(document.documentElement).fontSize) ||
        16;
      var gapsTotal;
      var divisor;
      if (screenW <= 560) {
        gapsTotal = 0.75 * rootFs;
        divisor = 2.35;
      } else if (screenW <= 900) {
        gapsTotal = 2.25 * rootFs;
        divisor = 4;
      } else {
        gapsTotal = 4.5 * rootFs;
        divisor = 7.2;
      }
      return Math.max(72, (trackW - gapsTotal) / divisor);
    }

    /** Pin every card to a measured px width so clone sets match for seamless wrap. */
    function sizeAlumniCards() {
      var cardW = alumniCardSizePx();
      if (!(cardW > 0)) return 0;
      var px = cardW + "px";
      carousel.style.setProperty("--alumni-card-w", px);
      track.querySelectorAll(".alumni-card").forEach(function (card) {
        card.style.flex = "0 0 " + px;
        card.style.width = px;
        card.style.maxWidth = "none";
      });
      return cardW;
    }

    function normalizeOffset() {
      if (!loopEnabled || setWidth <= 0 || !isFinite(offset)) {
        if (!isFinite(offset) || offset < 0) offset = 0;
        return;
      }
      offset = offset % setWidth;
      if (offset < 0) offset += setWidth;
    }

    function applyOffset() {
      normalizeOffset();
      var strip = getStrip();
      if (!strip) return;
      if (!loopEnabled || setWidth <= 0) {
        strip.style.transform = "";
        return;
      }
      strip.style.transform = "translate3d(" + -offset + "px,0,0)";
    }

    /** Write transform without wrapping — used mid-swipe so the loop can cross set seams. */
    function applyVisualOffset(pos) {
      var strip = getStrip();
      if (!strip || !loopEnabled) return;
      if (!isFinite(pos)) pos = 0;
      strip.style.transform = "translate3d(" + -pos + "px,0,0)";
    }

    function easeInOutCubic(t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function cancelStepAnim() {
      if (stepRafId) {
        cancelAnimationFrame(stepRafId);
        stepRafId = 0;
      }
      if (stepAnimating) {
        offset = stepVisual;
        applyOffset();
        stepAnimating = false;
      }
    }

    function buildStrip(copies) {
      var html = carousel._alumniCardsHtml || "";
      if (!html) return;
      var set =
        '<div class="alumni-marquee-set">' + html + "</div>";
      var clone =
        '<div class="alumni-marquee-set" aria-hidden="true">' + html + "</div>";
      track.innerHTML =
        '<div class="alumni-marquee-strip">' +
        set +
        (copies >= 2 ? clone : "") +
        "</div>";
      track.setAttribute("data-alumni-copies", String(copies >= 2 ? 2 : 1));
      var sets = getSets();
      if (sets[1]) {
        sets[1].querySelectorAll("[tabindex]").forEach(function (el) {
          el.setAttribute("tabindex", "-1");
        });
      }
      bindAlumniCardClicks(track, carousel._alumniPeople || []);
      sizeAlumniCards();
    }

    function measureSetWidth() {
      var strip = getStrip();
      var sets = getSets();
      if (!strip || !sets.length) return 0;
      // Prefer distance between first cards of each set — exact loop period
      // after JS px sizing (avoids offsetWidth + gap rounding drift on phones).
      if (sets.length >= 2) {
        var a = sets[0].querySelector(".alumni-card");
        var b = sets[1].querySelector(".alumni-card");
        if (a && b) {
          var dx = b.getBoundingClientRect().left - a.getBoundingClientRect().left;
          if (isFinite(dx) && dx > 1) return dx;
        }
        var gap = stripGapPx(strip);
        return Math.max(1, sets[0].offsetWidth + gap);
      }
      return Math.max(0, sets[0].offsetWidth);
    }

    function singleSetOverflows() {
      var sets = getSets();
      if (!sets.length) return false;
      // Compare one set to the track (ignore clone width).
      return sets[0].scrollWidth > track.clientWidth + ALUMNI_OVERFLOW_MIN_PX;
    }

    function setMode(looping) {
      loopEnabled = looping;
      [prev, next].forEach(function (btn) {
        if (!btn) return;
        btn.hidden = !looping;
        btn.disabled = !looping;
        btn.setAttribute("aria-hidden", looping ? "false" : "true");
        btn.tabIndex = looping ? 0 : -1;
      });
      carousel.classList.toggle("is-static", !looping);
      carousel.classList.toggle("is-scrollable", looping);
      carousel.classList.toggle("is-loopable", looping);
      carousel.classList.toggle("is-auto", looping && !prefersReducedMotion());
      carousel.classList.toggle("is-manual", !looping || prefersReducedMotion());
    }

    function stopLoop() {
      lastTs = 0;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      carousel.classList.remove("is-auto");
      if (loopEnabled) carousel.classList.add("is-manual");
    }

    function tick(now) {
      if (!loopEnabled || prefersReducedMotion()) {
        rafId = 0;
        return;
      }
      if (document.hidden || !sectionInView || setWidth <= 0) {
        lastTs = 0;
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (!lastTs) lastTs = now;
      var dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      if (dt > 0) {
        offset += ALUMNI_LOOP_PX_PER_SEC * dt;
        applyOffset();
      }
      rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (
        !loopEnabled ||
        prefersReducedMotion() ||
        document.hidden ||
        !sectionInView ||
        userPaused ||
        alumniSheetOpen() ||
        setWidth <= 0
      ) {
        return;
      }
      carousel.classList.add("is-auto");
      carousel.classList.remove("is-manual");
      if (!rafId) {
        lastTs = 0;
        rafId = requestAnimationFrame(tick);
      }
    }

    function stepAmount() {
      var card = track.querySelector(".alumni-card");
      var strip = getStrip();
      var gap = stripGapPx(strip);
      return card
        ? card.getBoundingClientRect().width + gap
        : Math.max(120, track.clientWidth * 0.4);
    }

    function step(dir) {
      if (!loopEnabled || setWidth <= 0) return;
      if (dir !== 1 && dir !== -1) return;
      onUserInteract();
      var amount = stepAmount();
      if (!isFinite(amount) || amount < 8) amount = Math.max(120, track.clientWidth * 0.4);

      if (prefersReducedMotion()) {
        cancelStepAnim();
        offset += dir * amount;
        applyOffset();
        return;
      }

      // Chain from the live visual position if a swipe is already running.
      var from = stepAnimating ? stepVisual : offset;
      // Keep the swipe inside the duplicated strip so reverse never reveals empty space.
      if (dir < 0 && from - amount < 0) {
        from += setWidth;
      } else if (dir > 0 && from > setWidth) {
        from = from % setWidth;
        if (from < 0) from += setWidth;
      }

      if (stepRafId) {
        cancelAnimationFrame(stepRafId);
        stepRafId = 0;
      }

      stepFrom = from;
      stepTo = from + dir * amount;
      stepVisual = from;
      stepStartedAt = performance.now();
      stepAnimating = true;
      var duration = stepDurationMs();
      applyVisualOffset(stepVisual);

      function stepTick(now) {
        if (!stepAnimating) {
          stepRafId = 0;
          return;
        }
        var t = Math.min(1, (now - stepStartedAt) / duration);
        var e = easeInOutCubic(t);
        stepVisual = stepFrom + (stepTo - stepFrom) * e;
        applyVisualOffset(stepVisual);
        if (t < 1) {
          stepRafId = requestAnimationFrame(stepTick);
          return;
        }
        stepRafId = 0;
        stepAnimating = false;
        offset = stepTo;
        applyOffset();
      }
      stepRafId = requestAnimationFrame(stepTick);
    }

    function ensureCopies(copies) {
      var current = parseInt(track.getAttribute("data-alumni-copies"), 10) || 0;
      var sets = getSets();
      if (getStrip() && current === copies && sets.length === copies) {
        if (carousel._alumniPeople) {
          bindAlumniCardClicks(track, carousel._alumniPeople);
        }
        return;
      }
      buildStrip(copies);
    }

    function applyLayoutMode() {
      if (layoutBusy) return;
      layoutBusy = true;
      try {
        var html = carousel._alumniCardsHtml;
        if (!html) return;
        if (carousel._alumniPeople) {
          track._alumniList = carousel._alumniPeople;
        }

        // Prefer measuring the first set in-place (avoids DOM thrash / RO loops).
        if (!getSets().length) buildStrip(1);
        else sizeAlumniCards();
        // Force layout so overflow + setWidth use the px-sized cards.
        void track.offsetWidth;
        var trackW = carousel.clientWidth || track.clientWidth || 0;
        if (trackW < 32) {
          // Section/carousel not laid out yet (e.g. was display:none) — retry shortly.
          setTimeout(function () {
            scheduleLayoutPass();
          }, 120);
          return;
        }
        var shouldLoop = singleSetOverflows();

        if (!shouldLoop) {
          cancelStepAnim();
          stopLoop();
          clearIdle();
          userPaused = false;
          ensureCopies(1);
          sizeAlumniCards();
          setMode(false);
          setWidth = 0;
          offset = 0;
          applyOffset();
          return;
        }

        ensureCopies(2);
        sizeAlumniCards();
        void track.offsetWidth;
        var nextSetWidth = measureSetWidth();
        if (nextSetWidth > 0) setWidth = nextSetWidth;
        setMode(true);
        applyOffset();

        if (!prefersReducedMotion() && sectionInView && !userPaused) {
          startLoop();
        } else if (userPaused) {
          stopLoop();
          if (!alumniSheetOpen()) scheduleResume();
        } else {
          stopLoop();
        }
      } finally {
        layoutBusy = false;
      }
    }

    carousel.alumniRefreshLayout = function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(applyLayoutMode);
      });
    };

    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });

    if (ALUMNI_ENABLE_DRAG_SWIPE) {
      // Removable: bindAlumniDragSwipe + ALUMNI_ENABLE_DRAG_SWIPE (search ALUMNI_DRAG_SWIPE).
      bindAlumniDragSwipe({
        track: track,
        carousel: carousel,
        tapSlopPx: TAP_SLOP_PX,
        isLoopEnabled: function () {
          return loopEnabled;
        },
        getOffset: function () {
          return stepAnimating ? stepVisual : offset;
        },
        setOffset: function (v) {
          offset = v;
        },
        applyOffset: applyOffset,
        applyVisualOffset: applyVisualOffset,
        cancelStepAnim: cancelStepAnim,
        stopLoop: stopLoop,
        onUserInteract: onUserInteract,
      });
    } else {
      // Fallback when drag-swipe is disabled: tap/click opens details only.
      var tapCard = null;
      var tapX = 0;
      var tapY = 0;
      var tapPointerId = null;

      function pointerDist(e) {
        var dx = e.clientX - tapX;
        var dy = e.clientY - tapY;
        return Math.sqrt(dx * dx + dy * dy);
      }

      track.addEventListener("pointerdown", function (e) {
        if (e.button != null && e.button !== 0) return;
        if (e.target.closest && e.target.closest(".carousel-arrow")) return;
        var card = e.target.closest(".alumni-card[data-alumni-index]");
        tapCard = card || null;
        tapX = e.clientX;
        tapY = e.clientY;
        tapPointerId = e.pointerId;
      });
      function finishPointer(e) {
        if (tapPointerId != null && e && e.pointerId != null && e.pointerId !== tapPointerId) {
          return;
        }
        var cardToOpen =
          tapCard && (!e || pointerDist(e) < TAP_SLOP_PX) ? tapCard : null;
        tapCard = null;
        tapPointerId = null;
        if (cardToOpen && track.contains(cardToOpen)) {
          track._alumniOpenedFromTap = true;
          openAlumniCardFromEl(track, cardToOpen);
          setTimeout(function () {
            track._alumniOpenedFromTap = false;
          }, 50);
        }
      }
      track.addEventListener("pointerup", finishPointer);
      track.addEventListener("pointercancel", function () {
        tapCard = null;
        tapPointerId = null;
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        lastTs = 0;
      } else if (
        loopEnabled &&
        sectionInView &&
        !prefersReducedMotion() &&
        !userPaused
      ) {
        startLoop();
      } else if (loopEnabled && userPaused && !alumniSheetOpen()) {
        scheduleResume();
      }
    });

    if (reducedMotionQuery && typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", function () {
        if (prefersReducedMotion()) {
          stopLoop();
          clearIdle();
        } else if (loopEnabled && sectionInView && !userPaused) {
          startLoop();
        }
      });
    }

    function onSectionVisibility(inView) {
      sectionInView = inView;
      if (!inView) {
        lastTs = 0;
        return;
      }
      // Always remeasure when the row becomes visible. An earlier pass can run
      // while the section still has no width (starts as .hidden) and wrongly
      // lock into static mode — which disables both auto-scroll and drag physics.
      // applyLayoutMode() restarts the loop when measurement says we should.
      scheduleLayoutPass();
    }

    function scheduleLayoutPass() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        applyLayoutMode();
      }, 100);
    }

    if (typeof ResizeObserver === "function") {
      var ro = new ResizeObserver(function () {
        scheduleLayoutPass();
      });
      ro.observe(carousel);
    } else {
      window.addEventListener("resize", scheduleLayoutPass);
    }

    // Remeasure after images settle so setWidth stays accurate.
    track.addEventListener(
      "load",
      function (e) {
        if (e.target && e.target.tagName === "IMG") scheduleLayoutPass();
      },
      true,
    );

    requestAnimationFrame(function () {
      requestAnimationFrame(applyLayoutMode);
    });

    if (typeof IntersectionObserver === "function") {
      var io = new IntersectionObserver(
        function (entries) {
          var entry = entries[0];
          if (!entry) return;
          // Observe the carousel (cards), not the whole section — sticky header
          // + tall heading used to keep intersectionRatio under the old threshold.
          onSectionVisibility(!!entry.isIntersecting);
        },
        {
          threshold: [0, 0.01, 0.1, 0.25, 0.5, 1],
          // Start a beat early so motion is already going when cards enter view.
          rootMargin: "0px 0px 12% 0px",
        },
      );
      io.observe(carousel);
      // Seed from current geometry (IO can be late on first paint / cache restore).
      var seedRect = carousel.getBoundingClientRect();
      if (
        seedRect.bottom > 0 &&
        seedRect.top < (window.innerHeight || 0) + seedRect.height * 0.12
      ) {
        onSectionVisibility(true);
      }
    } else {
      onSectionVisibility(true);
    }
  }

  function eventCardHtml(ev, compact, index) {
    return (
      '<article class="event-card" role="button" tabindex="0" data-event-index="' +
      index +
      '" aria-label="View details for ' +
      escapeHtml(ev.name || "event") +
      '">' +
      '<div class="event-card-media">' +
      placeholder(ev.image || "", "", "w-full", "navy", ev.name || "") +
      "</div>" +
      "<h3>" +
      escapeHtml(ev.name || "") +
      "</h3><p class=\"event-card-meta\">" +
      escapeHtml(ev.date || "") +
      "</p><p class=\"event-card-meta\">" +
      escapeHtml(ev.location || "") +
      "</p></article>"
    );
  }

  function ensureEventSheet() {
    var sheet = document.querySelector("[data-event-sheet]");
    if (sheet) return sheet;
    sheet = document.createElement("div");
    sheet.className = "event-sheet hidden";
    sheet.setAttribute("data-event-sheet", "");
    sheet.setAttribute("aria-hidden", "true");
    sheet.innerHTML =
      '<div class="event-sheet-backdrop" data-event-sheet-close tabindex="-1"></div>' +
      '<div class="event-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="event-sheet-title">' +
      '<header class="event-sheet-head">' +
      '<h2 id="event-sheet-title">Event</h2>' +
      '<button type="button" class="event-sheet-close" data-event-sheet-close aria-label="Close">&times;</button>' +
      "</header>" +
      '<div class="event-sheet-body" data-event-sheet-body></div>' +
      "</div>";
    document.body.appendChild(sheet);
    return sheet;
  }

  function closeEventSheet() {
    var sheet = document.querySelector("[data-event-sheet]");
    if (!sheet) return;
    markOverlayClosing(sheet);
    var allModal = document.getElementById("events-modal");
    if (!(allModal && allModal.classList.contains("is-open"))) {
      document.body.classList.remove("event-sheet-lock");
    }
    scheduleOverlayHide(sheet);
  }

  function openEventSheet(ev) {
    if (!ev) return;
    var sheet = ensureEventSheet();
    var title = document.getElementById("event-sheet-title");
    var body = sheet.querySelector("[data-event-sheet-body]");
    if (title) title.textContent = ev.name || "Event";
    if (body) {
      var evImg = safeMediaUrl(ev.image);
      var imgHtml = evImg
        ? '<div class="event-sheet-media"><img src="' +
          escapeHtml(evImg) +
          '" alt="' +
          escapeHtml(ev.name || "") +
          '" loading="lazy" decoding="async"></div>'
        : '<div class="event-sheet-media event-sheet-media-empty" aria-hidden="true"></div>';
      var metaBits = [];
      if (ev.date) metaBits.push("<span>" + escapeHtml(ev.date) + "</span>");
      if (ev.location) metaBits.push("<span>" + escapeHtml(ev.location) + "</span>");
      var desc = String(ev.description || "").trim();
      var link = safeUrl(ev.link || "");
      body.innerHTML =
        imgHtml +
        '<h3 class="event-sheet-name">' +
        escapeHtml(ev.name || "Event") +
        "</h3>" +
        (metaBits.length
          ? '<div class="event-sheet-meta">' + metaBits.join("") + "</div>"
          : "") +
        (desc
          ? '<p class="event-sheet-desc">' + escapeHtml(desc).replace(/\n/g, "<br>") + "</p>"
          : '<p class="event-sheet-desc muted">No description yet.</p>') +
        (link
          ? '<a class="btn btn-orange event-sheet-link" href="' +
            escapeHtml(link) +
            '" target="_blank" rel="noopener noreferrer">Open link</a>'
          : "") +
        '<div class="event-sheet-actions">' +
        '<button type="button" class="btn btn-outline-navy event-sheet-copy" data-event-copy>Copy link</button>' +
        "</div>";
      var shareUrl = absoluteShareUrl(link || pageShareUrl());
      var copyBtn = body.querySelector("[data-event-copy]");
      if (copyBtn) {
        copyBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          copyLinkOnly(shareUrl, copyBtn);
        });
      }
    }

    prepareOverlayOpen(sheet);
    document.body.classList.add("event-sheet-lock");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        sheet.classList.add("is-open");
      });
    });

    if (!sheet.getAttribute("data-bound")) {
      sheet.setAttribute("data-bound", "1");
      sheet.querySelectorAll("[data-event-sheet-close]").forEach(function (el) {
        el.addEventListener("click", closeEventSheet);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && sheet.classList.contains("is-open")) {
          e.preventDefault();
          closeEventSheet();
        }
      });
    }
  }

  function bindEventCardClicks(root, list) {
    if (!root) return;
    function openFromEl(el) {
      var i = parseInt(el.getAttribute("data-event-index"), 10);
      if (isNaN(i) || !list[i]) return;
      openEventSheet(list[i]);
    }
    root.querySelectorAll("[data-event-index]").forEach(function (card) {
      card.addEventListener("click", function () {
        openFromEl(card);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        openFromEl(card);
      });
    });
  }

  function openEventsModal() {
    var modal = document.getElementById("events-modal");
    if (!modal) return;
    prepareOverlayOpen(modal);
    document.body.classList.add("event-sheet-lock");
    // Double rAF so display:none → visible paints before is-open transitions.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        modal.classList.add("is-open");
      });
    });
  }

  function closeEventsModal() {
    var modal = document.getElementById("events-modal");
    if (!modal || modal.classList.contains("hidden")) return;
    markOverlayClosing(modal);
    // Keep lock if event detail sheet is still open on top.
    var detail = document.querySelector("[data-event-sheet]");
    if (!(detail && detail.classList.contains("is-open"))) {
      document.body.classList.remove("event-sheet-lock");
    }
    scheduleOverlayHide(modal);
  }

  function safeGoogleCalendarUrl(href) {
    var url = safeUrl(href);
    if (!url) return "";
    if (!/^https:\/\//i.test(url)) return "";
    try {
      var host = new URL(url).hostname.toLowerCase();
      if (host === "calendar.google.com" || host.endsWith(".calendar.google.com")) {
        return url;
      }
    } catch (e) {
      return "";
    }
    return "";
  }

  /** Apply VSA brand-friendly embed chrome params (Google’s iframe is limited). */
  function polishGoogleCalendarEmbed(embedUrl) {
    try {
      var embed = new URL(embedUrl);
      if (!embed.searchParams.get("ctz")) {
        embed.searchParams.set("ctz", "America/Chicago");
      }
      embed.searchParams.set("showTitle", "0");
      embed.searchParams.set("showNav", "1");
      embed.searchParams.set("showDate", "1");
      embed.searchParams.set("showPrint", "0");
      embed.searchParams.set("showTabs", "0");
      embed.searchParams.set("showCalendars", "0");
      embed.searchParams.set("showTz", "0");
      embed.searchParams.set("bgcolor", "#F5F7FA");
      // Event accent — pairs with src for single-calendar embeds.
      if (embed.searchParams.get("src") && !embed.searchParams.get("color")) {
        embed.searchParams.set("color", "#FF811D");
      }
      return embed.toString();
    } catch (e) {
      return embedUrl;
    }
  }

  /** Build an in-page embed URL from a public/share/embed Google Calendar link. */
  function googleCalendarEmbedUrl(href) {
    var url = safeGoogleCalendarUrl(href);
    if (!url) return "";
    try {
      var u = new URL(url);
      if (/\/calendar\/embed\/?/i.test(u.pathname)) {
        return polishGoogleCalendarEmbed(u.toString());
      }
      var src = u.searchParams.get("src") || u.searchParams.get("cid");
      if (!src) return "";
      var embed = new URL("https://calendar.google.com/calendar/embed");
      embed.searchParams.set("src", src);
      if (u.searchParams.get("ctz")) {
        embed.searchParams.set("ctz", u.searchParams.get("ctz"));
      }
      return polishGoogleCalendarEmbed(embed.toString());
    } catch (e) {
      return "";
    }
  }

  function renderEvents(content) {
    var events = content.events || {};
    var list = sortEventsByDate((events.upcoming || []).filter(isContentVisible));

    setText("#events-page-heading", events.pageHeading || "Events");
    setText("#events-all-btn", events.viewAllLabel || "View all events");
    setText("#events-upcoming-heading", events.upcomingHeading || "Upcoming Events");
    setText("#events-modal-title", events.allModalTitle || "All events");
    setText("#events-calendar-kicker", events.calendarKicker || "Schedule");
    setText("#events-calendar-title", events.calendarTitle || "Auburn VSA calendar");
    setText("#events-gcal-btn", events.calendarButtonLabel || "Open full calendar");

    var gcalRaw = safeGoogleCalendarUrl(events.calendarUrl || "");
    var gcalEmbed = googleCalendarEmbedUrl(events.calendarUrl || "");
    var gcalBtn = document.getElementById("events-gcal-btn");
    if (gcalBtn) {
      if (gcalRaw) {
        gcalBtn.href = gcalRaw;
        gcalBtn.classList.remove("hidden");
      } else {
        gcalBtn.removeAttribute("href");
        gcalBtn.classList.add("hidden");
      }
    }
    var gcalWrap = document.getElementById("events-calendar");
    var gcalFrame = document.getElementById("events-gcal-frame");
    if (gcalWrap && gcalFrame) {
      if (gcalRaw || gcalEmbed) {
        gcalWrap.classList.remove("hidden");
        if (gcalEmbed) {
          if (gcalFrame.getAttribute("src") !== gcalEmbed) {
            gcalFrame.src = gcalEmbed;
          }
          gcalFrame.classList.remove("hidden");
          if (gcalFrame.parentElement) gcalFrame.parentElement.classList.remove("hidden");
        } else {
          gcalFrame.removeAttribute("src");
          if (gcalFrame.parentElement) gcalFrame.parentElement.classList.add("hidden");
        }
      } else {
        gcalFrame.removeAttribute("src");
        gcalWrap.classList.add("hidden");
      }
    }

    var track = document.getElementById("events-track");
    if (track) {
      if (!list.length) {
        track.innerHTML = '<p class="muted events-empty">No upcoming events yet. Check back soon.</p>';
      } else {
        track.innerHTML = list
          .map(function (ev, i) {
            return eventCardHtml(ev, false, i);
          })
          .join("");
        bindEventCardClicks(track, list);
        bindEventsCarousel(track);
      }
    }

    var allList = document.getElementById("events-all-list");
    if (allList) {
      if (!list.length) {
        allList.innerHTML = '<p class="muted">No events yet. Check back soon.</p>';
      } else {
        allList.innerHTML =
          '<div class="events-all-grid">' +
          list
            .map(function (ev, i) {
              return eventCardHtml(ev, true, i);
            })
            .join("") +
          "</div>";
        bindEventCardClicks(allList, list);
      }
    }

    var openBtn = document.getElementById("events-all-btn");
    if (openBtn && !openBtn.getAttribute("data-bound")) {
      openBtn.setAttribute("data-bound", "1");
      openBtn.addEventListener("click", openEventsModal);
    }
    var modal = document.getElementById("events-modal");
    if (modal && !modal.getAttribute("data-bound")) {
      modal.setAttribute("data-bound", "1");
      modal.querySelectorAll("[data-events-close]").forEach(function (el) {
        el.addEventListener("click", closeEventsModal);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        var sheet = document.querySelector("[data-event-sheet]");
        if (sheet && sheet.classList.contains("is-open")) return;
        closeEventsModal();
      });
    }
  }

  function bindEventsCarousel(track) {
    var carousel = track.closest(".carousel");
    if (!carousel || carousel.getAttribute("data-carousel-bound")) return;
    carousel.setAttribute("data-carousel-bound", "1");
    var prev = carousel.querySelector(".carousel-arrow.prev") || carousel.querySelector('.carousel-arrow[aria-label*="Previous"]');
    var next = carousel.querySelector(".carousel-arrow.next") || carousel.querySelector('.carousel-arrow[aria-label*="Next"]');
    function step(dir) {
      var card = track.querySelector(".event-card");
      var amount = card ? card.getBoundingClientRect().width + 24 : track.clientWidth * 0.85;
      track.scrollBy({ left: dir * amount, behavior: "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
  }

  function isRoyaleGalleryCategory(cat) {
    var name = String((cat && cat.name) || "").toLowerCase();
    return name.indexOf("royale") !== -1;
  }

  /**
   * Pull Auburn Royale album photos from Gallery CMS (same albums as gallery.html).
   * Prefers the default school year, then older years; de-dupes; caps length.
   */
  function collectRoyaleGalleryImages(gallery) {
    var years = normalizeGalleryYears(gallery || {});
    if (!years.length) return [];
    var preferred = pickDefaultGalleryYear(years, gallery);
    var ordered = [];
    if (preferred) ordered.push(preferred);
    years
      .slice()
      .sort(function (a, b) {
        var ak = normalizeSchoolYearKey(a.id) || normalizeSchoolYearKey(a.label);
        var bk = normalizeSchoolYearKey(b.id) || normalizeSchoolYearKey(b.label);
        return bk.localeCompare(ak);
      })
      .forEach(function (y) {
        if (!preferred || y.id !== preferred.id) ordered.push(y);
      });

    var seen = {};
    var out = [];
    var CAP = 24;
    ordered.forEach(function (year) {
      (year.categories || []).forEach(function (cat) {
        if (!isContentVisible(cat)) return;
        if (!isRoyaleGalleryCategory(cat)) return;
        categoryAlbumImages(cat).forEach(function (src) {
          var url = safeMediaUrl(src);
          if (!url || seen[url]) return;
          seen[url] = true;
          out.push({
            src: url,
            name: (cat && cat.name) || "Auburn Royale",
          });
        });
      });
    });
    return out.slice(0, CAP);
  }

  function renderRoyale(content) {
    var royale = content.royale || {};
    var links = content.links || {};
    setText("#royale-hero-title", royale.heroTitle || "Auburn Royale");
    setText("#royale-hero-subtitle", royale.heroSubtitle || "");
    var meta = document.getElementById("royale-meta");
    if (meta) {
      var bits = [];
      if (royale.eventDate) bits.push("<span>" + escapeHtml(royale.eventDate) + "</span>");
      if (royale.eventLocation) bits.push("<span>" + escapeHtml(royale.eventLocation) + "</span>");
      if (royale.eventCost) bits.push("<span>" + escapeHtml(royale.eventCost) + "</span>");
      meta.innerHTML = bits.join("");
      meta.style.display = bits.length ? "" : "none";
    }
    setText("#royale-intro", royale.introText || "");
    setText("#royale-expect", royale.expectText || "");
    setText("#royale-welcome", royale.welcomeText || "");
    setText("#royale-ticketing", royale.ticketingText || "");
    setHref("#royale-tickets", links.purchaseTickets || "", { hideIfEmpty: true });
    setBrandHeading("#royale-about-heading", royale.aboutHeading, "About | Auburn Royale");
    setText("#royale-expect-heading", royale.expectHeading || "What to expect");
    setText("#royale-welcome-heading", royale.welcomeHeading || "Who’s welcome");
    setBrandHeading("#royale-video-heading", royale.videoHeading, "Royale | in motion");
    setText("#royale-video-subtext", royale.videoSubtext || "");
    setBrandHeading("#royale-gallery-heading", royale.galleryHeading, "Gallery | highlights");
    setText("#royale-gallery-subtext", royale.gallerySubtext || "");
    setText("#royale-gallery-btn", royale.galleryButtonLabel || "View full gallery");
    setBrandHeading("#royale-sponsors-heading", royale.sponsorsHeading, "Sponsors | & partners");
    setText("#royale-sponsors-subtext", royale.sponsorsSubtext || "");
    setText("#royale-ticketing-heading", royale.ticketingHeading || "Ticketing");
    setText("#royale-tickets", royale.ticketsButtonLabel || "Purchase Tickets");
    setText("#royale-share-btn", royale.shareButtonLabel || "Share Auburn Royale");
    setText("#royale-copy-btn", royale.copyButtonLabel || "Copy link");
    var expectBlock = document.getElementById("royale-expect-block");
    var welcomeBlock = document.getElementById("royale-welcome-block");
    if (expectBlock) {
      expectBlock.classList.toggle("hidden", !(royale.expectText || "").trim());
    }
    if (welcomeBlock) {
      welcomeBlock.classList.toggle("hidden", !(royale.welcomeText || "").trim());
    }

    var royaleVideoSection = document.getElementById("royale-video-section");
    var hasRoyaleVideo = renderVideoPlayer(document.getElementById("royale-video"), {
      videoUrl: royale.videoUrl || "",
      videoImage: royale.videoImage || "",
      title: "Auburn Royale video",
    });
    if (royaleVideoSection) royaleVideoSection.classList.toggle("hidden", !hasRoyaleVideo);

    var galleryPhotos = collectRoyaleGalleryImages(content.gallery);
    var galleryAlbum = galleryPhotos.map(function (item) {
      return { src: item.src, link: "", name: item.name || "" };
    });
    var gallerySlides = galleryPhotos.map(function (item, i) {
      return {
        src: item.src,
        alt: item.name || "Auburn Royale",
        caption: item.name || "",
        onClick: function () {
          openGalleryLightbox("Auburn Royale", galleryAlbum, i);
        },
      };
    });
    mountSlideshow(document.getElementById("royale-gallery"), gallerySlides, {
      intervalMs: slideshowIntervalMs(content),
      slideClass: "slideshow-slide royale-gallery-slide",
      captionBelow: true,
      stageClass: "royale-highlights-stage",
      hideWhenEmpty: document.getElementById("royale-gallery-section"),
      emptyHtml: "",
    });

    var sponsorItems = (royale.sponsorsImages || [])
      .map(function (item) {
        if (!item) return null;
        if (typeof item === "string") return { image: item, link: "", name: "", visible: "yes" };
        if (!isContentVisible(item)) return null;
        return { image: item.image || "", link: item.link || "", name: item.name || "" };
      })
      .filter(function (item) {
        return item && item.image;
      });
    // Legacy single sponsorsImage support
    if (!sponsorItems.length && royale.sponsorsImage) {
      sponsorItems = [{ image: royale.sponsorsImage, link: "", name: "" }];
    }
    // Same highlight interaction as gallery/home: hit buttons + lightbox
    // (not raw <a href>, which fights swipe/tap on mobile).
    var sponsorAlbum = sponsorItems.map(function (item) {
      return {
        src: item.image,
        link: item.link || "",
        name: item.name || "",
      };
    });
    var sponsorSlides = sponsorItems.map(function (item, i) {
      return {
        src: item.image,
        alt: item.name || "Sponsor",
        caption: item.name || "",
        onClick: function () {
          openGalleryLightbox("Sponsors & partners", sponsorAlbum, i);
        },
      };
    });
    mountSlideshow(document.getElementById("royale-sponsors"), sponsorSlides, {
      intervalMs: slideshowIntervalMs(content),
      // Keep logos on .sponsor-slide (contain) — do not pair with royale-gallery-slide (cover).
      slideClass: "slideshow-slide sponsor-slide",
      captionBelow: true,
      stageClass: "royale-highlights-stage",
      emptyHtml:
        '<div class="org-placeholder royale-sponsors-empty">' +
        '<p class="org-empty-label">Sponsors coming soon</p>' +
        dotsPlaceholder(3) +
        "</div>",
    });

    var royaleShare = document.getElementById("royale-share-btn");
    var royaleCopy = document.getElementById("royale-copy-btn");
    var royaleUrl = pageShareUrl();
    var royaleTitle = royale.heroTitle || "Auburn Royale";
    if (royaleShare) {
      royaleShare.onclick = function () {
        shareOrCopy(royaleTitle, royale.introText || "", royaleUrl);
      };
    }
    if (royaleCopy) {
      royaleCopy.onclick = function () {
        copyLinkOnly(royaleUrl, royaleCopy);
      };
    }
  }

  function categoryAlbumImages(cat) {
    var imgs = [];
    (cat.images || []).forEach(function (item) {
      var src = typeof item === "string" ? item : item && item.image;
      if (src) imgs.push(src);
    });
    if (!imgs.length && cat.image) imgs.push(cat.image);
    return imgs;
  }

  function ensureGalleryLightbox() {
    var modal = document.getElementById("gallery-lightbox");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "gallery-lightbox";
    modal.className = "gallery-lightbox hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "gallery-lightbox-title");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML =
      '<div class="gallery-lightbox-backdrop" data-lightbox-close tabindex="-1"></div>' +
      '<div class="gallery-lightbox-panel">' +
      '<header class="gallery-lightbox-head">' +
      '<h2 id="gallery-lightbox-title">Album</h2>' +
      '<button type="button" class="gallery-lightbox-close" data-lightbox-close aria-label="Close">&times;</button>' +
      "</header>" +
      '<div class="gallery-lightbox-body">' +
      '<div class="gallery-lightbox-main">' +
      '<button type="button" class="gallery-nav prev" id="gallery-prev" aria-label="Previous photo">&#8249;</button>' +
      '<img id="gallery-lightbox-img" src="" alt="">' +
      '<button type="button" class="gallery-nav next" id="gallery-next" aria-label="Next photo">&#8250;</button>' +
      "</div>" +
      '<p class="gallery-lightbox-count" id="gallery-lightbox-count"></p>' +
      '<div class="gallery-lightbox-link-wrap hidden" id="gallery-lightbox-link-wrap">' +
      '<a class="btn btn-orange" id="gallery-lightbox-link" href="#" target="_blank" rel="noopener noreferrer">Open link</a>' +
      "</div>" +
      '<div class="gallery-thumbs" id="gallery-thumbs"></div>' +
      "</div></div>";
    document.body.appendChild(modal);
    return modal;
  }

  function normalizeLightboxImages(images) {
    return (images || [])
      .map(function (img) {
        if (!img) return null;
        if (typeof img === "string") {
          var s = safeMediaUrl(img);
          return s ? { src: s, link: "", name: "" } : null;
        }
        var src = safeMediaUrl(img.src || img.image || "");
        if (!src) return null;
        return {
          src: src,
          link: (img.link || "").trim(),
          name: (img.name || img.title || img.caption || "").trim(),
        };
      })
      .filter(function (img) {
        return img && img.src;
      });
  }

  function bindGalleryLightboxChrome(modal) {
    if (!modal || modal.getAttribute("data-bound")) return;
    modal.setAttribute("data-bound", "1");
    modal.querySelectorAll("[data-lightbox-close]").forEach(function (el) {
      el.addEventListener("click", closeGalleryLightbox);
    });
  }

  function openGalleryLightbox(title, images, startIndex) {
    var items = normalizeLightboxImages(images);
    var modal = ensureGalleryLightbox();
    bindGalleryLightboxChrome(modal);
    if (!modal || !items.length) return;

    var index = startIndex || 0;
    var imgEl = document.getElementById("gallery-lightbox-img");
    var titleEl = document.getElementById("gallery-lightbox-title");
    var countEl = document.getElementById("gallery-lightbox-count");
    var thumbs = document.getElementById("gallery-thumbs");
    var linkWrap = document.getElementById("gallery-lightbox-link-wrap");
    var linkEl = document.getElementById("gallery-lightbox-link");

    function syncLink() {
      var link = safeUrl((items[index] && items[index].link) || "");
      if (!linkWrap || !linkEl) return;
      if (link) {
        linkEl.href = link;
        linkWrap.classList.remove("hidden");
      } else {
        linkEl.removeAttribute("href");
        linkWrap.classList.add("hidden");
      }
    }

    function show(i) {
      index = ((i % items.length) + items.length) % items.length;
      if (imgEl) {
        imgEl.src = items[index].src;
        imgEl.alt = items[index].name || (title || "Photo") + " " + (index + 1);
      }
      if (countEl) countEl.textContent = index + 1 + " / " + items.length;
      if (thumbs) {
        thumbs.querySelectorAll("button").forEach(function (btn, bi) {
          btn.classList.toggle("on", bi === index);
        });
      }
      syncLink();
    }

    if (titleEl) titleEl.textContent = title || "Album";
    if (thumbs) {
      thumbs.innerHTML = items
        .map(function (item, i) {
          return (
            '<button type="button" class="gallery-thumb' +
            (i === index ? " on" : "") +
            '" data-i="' +
            i +
            '"><img src="' +
            escapeHtml(item.src) +
            '" alt=""></button>'
          );
        })
        .join("");
      thumbs.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          show(parseInt(btn.getAttribute("data-i"), 10) || 0);
        });
      });
    }

    function onKey(e) {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeGalleryLightbox();
      }
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    }

    if (modal._galleryKeyHandler) {
      document.removeEventListener("keydown", modal._galleryKeyHandler);
    }
    modal._galleryKeyHandler = onKey;
    document.addEventListener("keydown", onKey);

    var prev = document.getElementById("gallery-prev");
    var next = document.getElementById("gallery-next");
    if (prev) {
      prev.onclick = function () {
        show(index - 1);
      };
    }
    if (next) {
      next.onclick = function () {
        show(index + 1);
      };
    }

    var main = modal.querySelector(".gallery-lightbox-main");
    if (main) {
      if (modal._galleryTouchStart) {
        main.removeEventListener("touchstart", modal._galleryTouchStart);
        main.removeEventListener("touchend", modal._galleryTouchEnd);
      }
      var touchX = null;
      modal._galleryTouchStart = function (e) {
        if (!e.changedTouches || !e.changedTouches[0]) return;
        touchX = e.changedTouches[0].clientX;
      };
      modal._galleryTouchEnd = function (e) {
        if (touchX == null || !e.changedTouches || !e.changedTouches[0]) return;
        var dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) < 48) return;
        if (dx < 0) show(index + 1);
        else show(index - 1);
      };
      main.addEventListener("touchstart", modal._galleryTouchStart, { passive: true });
      main.addEventListener("touchend", modal._galleryTouchEnd, { passive: true });
    }

    show(index);
    prepareOverlayOpen(modal);
    document.body.classList.add("event-sheet-lock");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        modal.classList.add("is-open");
      });
    });
  }

  function closeGalleryLightbox() {
    var modal = document.getElementById("gallery-lightbox");
    if (!modal || modal.classList.contains("hidden")) return;
    markOverlayClosing(modal);
    if (modal._galleryKeyHandler) {
      document.removeEventListener("keydown", modal._galleryKeyHandler);
      modal._galleryKeyHandler = null;
    }
    var main = modal.querySelector(".gallery-lightbox-main");
    if (main && modal._galleryTouchStart) {
      main.removeEventListener("touchstart", modal._galleryTouchStart);
      main.removeEventListener("touchend", modal._galleryTouchEnd);
      modal._galleryTouchStart = null;
      modal._galleryTouchEnd = null;
    }
    var detail = document.querySelector("[data-event-sheet]");
    var eventsAll = document.getElementById("events-modal");
    if (
      !(detail && detail.classList.contains("is-open")) &&
      !(eventsAll && eventsAll.classList.contains("is-open"))
    ) {
      document.body.classList.remove("event-sheet-lock");
    }
    setTimeout(function () {
      if (!modal || modal.classList.contains("is-open")) return;
      modal.classList.add("hidden");
      modal.removeAttribute("data-closing");
      modal.style.pointerEvents = "";
      var imgEl = document.getElementById("gallery-lightbox-img");
      if (imgEl) imgEl.removeAttribute("src");
    }, OVERLAY_CLOSE_MS);
  }

  function parseYouTubeId(url) {
    // Keep in sync with assets/js/admin.js parseYouTubeId.
    if (!url) return "";
    var m = String(url).trim().match(
      /(?:youtube\.com\/(?:watch\?(?:[^&#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
    );
    return m ? m[1] : "";
  }

  function parseVimeoId(url) {
    // Keep in sync with assets/js/admin.js parseVimeoId.
    if (!url) return "";
    var m = String(url).trim().match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    return m ? m[1] : "";
  }

  // Shared player for the Gallery end-of-year video and the AU Royale video.
  // Returns true when a playable video was mounted.
  function renderVideoPlayer(mount, opts) {
    if (!mount) return false;
    opts = opts || {};
    var title = opts.title || "Video";
    var videoUrl = safeMediaUrl(String(opts.videoUrl || "").trim());
    var poster = safeMediaUrl(opts.videoImage || "");
    if (!videoUrl) {
      mount.innerHTML = opts.placeholderWhenEmpty
        ? placeholder(poster, title, "ratio-16x6 w-full", "orange")
        : "";
      return false;
    }

    var yt = parseYouTubeId(videoUrl);
    var vim = parseVimeoId(videoUrl);

    if (yt || vim) {
      var embedSrc = yt
        ? "https://www.youtube.com/embed/" +
          yt +
          "?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=" +
          yt
        : "https://player.vimeo.com/video/" + vim + "?autoplay=1&muted=1&loop=1&title=0&byline=0";
      mount.innerHTML =
        '<div class="eoy-player eoy-embed-wrap">' +
        '<iframe class="eoy-video eoy-embed" src="' +
        escapeHtml(embedSrc) +
        '" title="' +
        escapeHtml(title) +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>' +
        '<p class="eoy-embed-note">Playing muted — use the player controls to unmute or go fullscreen.</p>' +
        "</div>";
      return true;
    }

    mount.innerHTML =
      '<div class="eoy-player">' +
      '<video class="eoy-video" playsinline muted autoplay loop preload="metadata"' +
      (poster ? ' poster="' + escapeHtml(poster) + '"' : "") +
      ">" +
      '<source src="' +
      escapeHtml(videoUrl) +
      '">' +
      "Your browser does not support video." +
      "</video>" +
      '<div class="eoy-controls">' +
      '<button type="button" class="eoy-btn eoy-mute" aria-label="Unmute">Unmute</button>' +
      '<label class="eoy-vol"><span>Volume</span> <input class="eoy-volume" type="range" min="0" max="1" step="0.05" value="0.7" aria-label="Volume"></label>' +
      '<button type="button" class="eoy-btn eoy-fs" aria-label="Fullscreen">Fullscreen</button>' +
      "</div></div>";

    var video = mount.querySelector("video.eoy-video");
    var muteBtn = mount.querySelector(".eoy-mute");
    var vol = mount.querySelector(".eoy-volume");
    var fsBtn = mount.querySelector(".eoy-fs");
    if (!video) return true;
    video.muted = true;
    video.play().catch(function () {});
    if (muteBtn) {
      muteBtn.addEventListener("click", function () {
        video.muted = !video.muted;
        if (!video.muted && vol) video.volume = parseFloat(vol.value) || 0.7;
        muteBtn.textContent = video.muted ? "Unmute" : "Mute";
      });
    }
    if (vol) {
      vol.addEventListener("input", function () {
        video.volume = parseFloat(vol.value) || 0;
        if (video.volume > 0 && video.muted) {
          video.muted = false;
          if (muteBtn) muteBtn.textContent = "Mute";
        }
      });
    }
    if (fsBtn) {
      fsBtn.addEventListener("click", function () {
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
      });
    }
    return true;
  }

  function renderGalleryVideo(gallery) {
    renderVideoPlayer(document.getElementById("gallery-video"), {
      videoUrl: gallery.videoUrl || "",
      videoImage: gallery.videoImage || "",
      title: "End of year video",
      placeholderWhenEmpty: true,
    });
  }

  function normalizeGalleryYears(gallery) {
    if (Array.isArray(gallery.years) && gallery.years.length) {
      return gallery.years.map(function (y, i) {
        return {
          id: y.id || "year-" + i,
          label: y.label || y.id || "Year " + (i + 1),
          videoUrl: y.videoUrl || "",
          videoImage: y.videoImage || "",
          categories: Array.isArray(y.categories) ? y.categories : [],
        };
      });
    }
    return [
      {
        id: "current",
        label: gallery.year || "Current",
        videoUrl: gallery.videoUrl || "",
        videoImage: gallery.videoImage || "",
        categories: gallery.categories || [],
      },
    ];
  }

  /** Auburn school year id like "2025-2026" (starts in August). */
  function currentSchoolYearId() {
    var now = new Date();
    var y = now.getFullYear();
    var start = now.getMonth() >= 7 ? y : y - 1;
    return start + "-" + (start + 1);
  }

  function normalizeSchoolYearKey(value) {
    var m = String(value || "").match(/(20\d{2})\s*[-–—]\s*(20\d{2})/);
    if (!m) return "";
    return m[1] + "-" + m[2];
  }

  function pickDefaultGalleryYear(years, gallery) {
    if (!years || !years.length) return null;
    var prefer = currentSchoolYearId();
    var match = years.find(function (y) {
      return (
        y.id === prefer ||
        normalizeSchoolYearKey(y.id) === prefer ||
        normalizeSchoolYearKey(y.label) === prefer
      );
    });
    if (match) return match;
    var activeId = gallery && gallery.activeYearId;
    if (activeId) {
      match = years.find(function (y) {
        return y.id === activeId;
      });
      if (match) return match;
    }
    // Newest labeled year first
    return years.slice().sort(function (a, b) {
      var ak = normalizeSchoolYearKey(a.id) || normalizeSchoolYearKey(a.label);
      var bk = normalizeSchoolYearKey(b.id) || normalizeSchoolYearKey(b.label);
      return bk.localeCompare(ak);
    })[0];
  }

  function renderGalleryYear(yearData) {
    renderGalleryVideo(yearData || {});
    var cats = document.getElementById("gallery-cats");
    if (!cats) return;
    var categories = ((yearData && yearData.categories) || []).filter(isContentVisible);
    cats.innerHTML = categories
      .map(function (cat, idx) {
        var coverSrc = safeMediaUrl(cat.image);
        var cover = coverSrc
          ? '<img src="' +
            escapeHtml(coverSrc) +
            '" alt="' +
            escapeHtml(cat.name || "") +
            '" loading="lazy" decoding="async">'
          : '<div class="gallery-tile-fill"></div>';
        return (
          '<div class="gallery-cat">' +
          '<p class="name">' +
          escapeHtml(cat.name || "") +
          "</p>" +
          '<div class="gallery-tile">' +
          cover +
          '<button type="button" class="btn btn-orange gallery-view-btn" data-cat="' +
          idx +
          '">View album</button>' +
          "</div></div>"
        );
      })
      .join("");

    cats.querySelectorAll(".gallery-view-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(btn.getAttribute("data-cat"), 10) || 0;
        var cat = categories[i] || {};
        var album = categoryAlbumImages(cat);
        if (!album.length) {
          var tile = btn.closest(".gallery-cat");
          var note = tile && tile.querySelector(".gallery-empty-note");
          if (!note && tile) {
            note = document.createElement("p");
            note.className = "gallery-empty-note";
            note.textContent =
              "No photos in this album yet. More are on AUinvolve and Instagram @auburnvsa.";
            tile.appendChild(note);
          }
          return;
        }
        openGalleryLightbox(cat.name || "Album", album, 0);
      });
    });
  }

  function renderGallery(content) {
    var gallery = content.gallery || {};
    setText("#gallery-page-heading", gallery.pageHeading || "Gallery");
    var years = normalizeGalleryYears(gallery);
    var active = pickDefaultGalleryYear(years, gallery);

    var yearMount = document.getElementById("gallery-year");
    if (yearMount) {
      if (years.length <= 1) {
        yearMount.innerHTML =
          '<span class="year-select-label">' + escapeHtml((active && active.label) || "") + "</span>";
      } else {
        yearMount.innerHTML =
          '<label class="year-select-label" for="gallery-year-select">School year</label>' +
          '<select id="gallery-year-select" class="year-select-input" aria-label="School year">' +
          years
            .map(function (y) {
              return (
                '<option value="' +
                escapeHtml(y.id) +
                '"' +
                (active && y.id === active.id ? " selected" : "") +
                ">" +
                escapeHtml(y.label) +
                "</option>"
              );
            })
            .join("") +
          "</select>";
        var sel = document.getElementById("gallery-year-select");
        if (sel) {
          sel.addEventListener("change", function () {
            var next =
              years.find(function (y) {
                return y.id === sel.value;
              }) || years[0];
            renderGalleryYear(next);
          });
        }
      }
    }

    renderGalleryYear(active);

    var lightbox = document.getElementById("gallery-lightbox");
    if (lightbox) bindGalleryLightboxChrome(lightbox);
  }

  function merchStatus(product) {
    var raw = String((product && (product.status || product.availability)) || "available")
      .toLowerCase()
      .replace(/[_]+/g, " ")
      .trim();
    if (raw.indexOf("sold") !== -1) return "sold-out";
    if (raw.indexOf("coming") !== -1) return "coming-soon";
    return "available";
  }

  function merchStatusLabel(status) {
    if (status === "sold-out") return "Sold out";
    if (status === "coming-soon") return "Coming soon";
    return "";
  }

  function renderMerch(content) {
    var merch = content.merch || {};
    setText("#merch-page-heading", merch.pageHeading || "Merchandise");
    setText(
      "#merch-page-lede",
      merch.pageLede ||
        "Rep Auburn VSA — tap any item for details and to buy when a shop link is live.",
    );
    setText("#merch-shop-heading", merch.shopHeading || "Shop the collection");
    var showcaseItems = (merch.showcaseImages || [])
      .map(function (item) {
        if (!item) return null;
        if (typeof item === "string") return { image: item, link: "", name: "", visible: "yes" };
        if (!isContentVisible(item)) return null;
        return { image: item.image || "", link: item.link || "", name: item.name || "" };
      })
      .filter(function (item) {
        return item && item.image;
      });
    // Legacy single showcaseImage support
    if (!showcaseItems.length && merch.showcaseImage) {
      showcaseItems = [{ image: merch.showcaseImage, link: "", name: "" }];
    }
    var showcaseSlides = showcaseItems.map(function (item) {
      return {
        src: item.image,
        href: item.link || "",
        alt: item.name || "Merch showcase",
        caption: item.name || "",
      };
    });
    mountSlideshow(document.getElementById("merch-showcase"), showcaseSlides, {
      intervalMs: slideshowIntervalMs(content),
      slideClass: "slideshow-slide merch-slide",
      captionBelow: true,
      stageClass: "merch-showcase-stage",
      emptyHtml:
        '<div class="org-placeholder merch-showcase-empty">' +
        '<p class="org-empty-label">Merch showcase coming soon</p>' +
        dotsPlaceholder(3) +
        "</div>",
    });

    var grid = document.getElementById("merch-products");
    if (!grid) return;
    var products = (merch.products || []).filter(isContentVisible);
    if (!products.length) {
      grid.innerHTML = '<p class="muted merch-empty">Merch drops will appear here when available.</p>';
      return;
    }
    grid.innerHTML = products
      .map(function (p, i) {
        var status = merchStatus(p);
        var badge = merchStatusLabel(status);
        var prodImg = safeMediaUrl(p.image);
        var img = prodImg
          ? '<img class="prod-img" src="' +
            escapeHtml(prodImg) +
            '" alt="' +
            escapeHtml(p.name || "") +
            '" loading="lazy" decoding="async">'
          : '<div class="prod-img prod-img-empty" aria-hidden="true"></div>';
        var price = String(p.price || "").trim();
        return (
          '<button type="button" class="product' +
          (status !== "available" ? " is-" + status : "") +
          '" data-merch-index="' +
          i +
          '" aria-label="View details for ' +
          escapeHtml(p.name || "product") +
          '">' +
          '<span class="prod-media">' +
          img +
          (badge
            ? '<span class="prod-badge prod-badge-' +
              status +
              '">' +
              escapeHtml(badge) +
              "</span>"
            : "") +
          "</span>" +
          '<span class="prod-body">' +
          "<h3>" +
          escapeHtml(p.name || "Product") +
          "</h3>" +
          (price ? '<p class="prod-price">' + escapeHtml(price) + "</p>" : "") +
          '<span class="prod-hint">View details</span>' +
          "</span>" +
          "</button>"
        );
      })
      .join("");

    bindMerchCardClicks(grid, products);
  }

  function ensureMerchSheet() {
    var sheet = document.querySelector("[data-merch-sheet]");
    if (sheet) return sheet;
    sheet = document.createElement("div");
    sheet.className = "event-sheet merch-sheet hidden";
    sheet.setAttribute("data-merch-sheet", "");
    sheet.setAttribute("aria-hidden", "true");
    sheet.innerHTML =
      '<div class="event-sheet-backdrop" data-merch-sheet-close tabindex="-1"></div>' +
      '<div class="event-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="merch-sheet-title">' +
      '<header class="event-sheet-head">' +
      '<h2 id="merch-sheet-title">Merch</h2>' +
      '<button type="button" class="event-sheet-close" data-merch-sheet-close aria-label="Close">&times;</button>' +
      "</header>" +
      '<div class="event-sheet-body" data-merch-sheet-body></div>' +
      "</div>";
    document.body.appendChild(sheet);
    return sheet;
  }

  function closeMerchSheet() {
    var sheet = document.querySelector("[data-merch-sheet]");
    if (!sheet) return;
    markOverlayClosing(sheet);
    var eventOpen = document.querySelector("[data-event-sheet].is-open");
    var eventsModal = document.getElementById("events-modal");
    if (
      !(eventOpen && eventOpen.classList.contains("is-open")) &&
      !(eventsModal && eventsModal.classList.contains("is-open"))
    ) {
      document.body.classList.remove("event-sheet-lock");
    }
    scheduleOverlayHide(sheet);
  }

  function openMerchSheet(product) {
    if (!product) return;
    var sheet = ensureMerchSheet();
    var title = document.getElementById("merch-sheet-title");
    var body = sheet.querySelector("[data-merch-sheet-body]");
    if (title) title.textContent = product.name || "Merch";
    if (body) {
      var merchImg = safeMediaUrl(product.image);
      var imgHtml = merchImg
        ? '<div class="event-sheet-media merch-sheet-media"><img src="' +
          escapeHtml(merchImg) +
          '" alt="' +
          escapeHtml(product.name || "") +
          '" loading="lazy" decoding="async"></div>'
        : '<div class="event-sheet-media merch-sheet-media event-sheet-media-empty" aria-hidden="true"></div>';
      var price = String(product.price || "").trim();
      var desc = String(product.description || "").trim();
      var link = safeUrl(product.link || "");
      var status = merchStatus(product);
      var badge = merchStatusLabel(status);
      var metaBits = [];
      if (price) {
        metaBits.push('<span class="merch-sheet-price">' + escapeHtml(price) + "</span>");
      }
      if (badge) {
        metaBits.push(
          '<span class="merch-sheet-status merch-sheet-status-' +
            status +
            '">' +
            escapeHtml(badge) +
            "</span>",
        );
      }
      var buyHtml = "";
      if (status === "sold-out") {
        buyHtml = '<p class="merch-buy-soon muted">This item is sold out.</p>';
      } else if (status === "coming-soon") {
        buyHtml = link
          ? '<a class="btn btn-orange event-sheet-link merch-buy-btn" href="' +
            escapeHtml(link) +
            '" target="_blank" rel="noopener noreferrer">Notify / follow drop</a>'
          : '<p class="merch-buy-soon muted">Coming soon — check Instagram for the drop.</p>';
      } else if (link) {
        buyHtml =
          '<a class="btn btn-orange event-sheet-link merch-buy-btn" href="' +
          escapeHtml(link) +
          '" target="_blank" rel="noopener noreferrer">Buy now</a>';
      } else {
        buyHtml = '<p class="merch-buy-soon muted">Purchase link coming soon.</p>';
      }
      body.innerHTML =
        imgHtml +
        '<h3 class="event-sheet-name">' +
        escapeHtml(product.name || "Product") +
        "</h3>" +
        (metaBits.length ? '<div class="event-sheet-meta">' + metaBits.join("") + "</div>" : "") +
        (desc
          ? '<p class="event-sheet-desc">' + escapeHtml(desc).replace(/\n/g, "<br>") + "</p>"
          : '<p class="event-sheet-desc muted">No description yet.</p>') +
        buyHtml;
    }

    prepareOverlayOpen(sheet);
    document.body.classList.add("event-sheet-lock");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        sheet.classList.add("is-open");
      });
    });

    if (!sheet.getAttribute("data-bound")) {
      sheet.setAttribute("data-bound", "1");
      sheet.querySelectorAll("[data-merch-sheet-close]").forEach(function (el) {
        el.addEventListener("click", closeMerchSheet);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && sheet.classList.contains("is-open")) {
          e.preventDefault();
          closeMerchSheet();
        }
      });
    }
  }

  function bindMerchCardClicks(root, list) {
    if (!root) return;
    function openFromEl(el) {
      var i = parseInt(el.getAttribute("data-merch-index"), 10);
      if (isNaN(i) || !list[i]) return;
      openMerchSheet(list[i]);
    }
    root.querySelectorAll("[data-merch-index]").forEach(function (card) {
      card.addEventListener("click", function () {
        openFromEl(card);
      });
    });
  }

  function renderFaqs(content) {
    var page = content.faqPage || {};
    setText("#faq-page-heading", page.pageHeading || "Frequently Asked Questions");
    setText("#faq-cta-kicker", page.ctaKicker || "Still curious?");
    setText(
      "#faq-cta-copy",
      page.ctaCopy ||
        "Ask anything about Auburn VSA. We’ll review it and add an answer when we can.",
    );
    var askLabel = page.askButtonLabel || "Ask a question";
    setText("#faq-ask-btn", askLabel);
    setText("#faq-sheet-title", page.sheetTitle || askLabel);
    setText(
      "#faq-sheet-lead",
      page.sheetLead ||
        "Your question goes to our team first. Published answers appear in the list above.",
    );
    setText("#faq-sheet-submit", page.submitLabel || "Submit question");

    var faqs = (content.faqs || []).filter(isContentVisible);
    var list = document.getElementById("faq-list");
    if (!list) return;
    if (!faqs.length) {
      list.innerHTML =
        '<p class="faq-empty">No published FAQs yet. Use &ldquo;' +
        escapeHtml(askLabel) +
        "&rdquo; below and we&rsquo;ll add answers soon.</p>";
      return;
    }
    list.innerHTML = faqs
      .map(function (faq, i) {
        var panelId = "faq-a-" + i;
        return (
          '<div class="faq-item"><button type="button" class="faq-q" aria-expanded="false" aria-controls="' +
          panelId +
          '" id="faq-q-' +
          i +
          '"><span class="q-text"><span class="num">Q' +
          (i + 1) +
          ".</span> " +
          escapeHtml(faq.question || "") +
          '</span><svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="faq-a" id="' +
          panelId +
          '" role="region" aria-labelledby="faq-q-' +
          i +
          '"><div class="faq-a-inner">' +
          escapeHtml(faq.answer || "") +
          "</div></div></div>"
        );
      })
      .join("");
    bindFaqAccordion(list);
  }

  function initTeamEffects(content) {
    if ((document.body.getAttribute("data-page") || "") !== "team") return;
    var effects = content.effects || {};
    var accentOn = String(effects.teamAccentLine || "yes") !== "no";
    // Floating star/motif bg removed (even if old CMS had teamFloatingMotifs=yes)
    if (!accentOn) return;

    var accent = document.createElement("div");
    accent.className = "team-accent";
    accent.setAttribute("aria-hidden", "true");
    accent.innerHTML = '<div class="team-accent-line"></div><div class="team-accent-bloom"></div>';
    document.body.appendChild(accent);

    function updateAccent() {
      var main = document.querySelector("main");
      if (!main) return;
      var rect = main.getBoundingClientRect();
      var viewH = window.innerHeight || 1;
      var total = Math.max(rect.height - viewH, 1);
      var scrolled = Math.min(Math.max(-rect.top, 0), total);
      var progress = scrolled / total;
      var y = viewH * 0.18 + progress * viewH * 0.64;
      accent.style.setProperty("--accent-y", y + "px");
      accent.classList.toggle("is-visible", rect.bottom > 80 && rect.top < viewH - 40);
    }

    updateAccent();
    window.addEventListener("scroll", updateAccent, { passive: true });
    window.addEventListener("resize", updateAccent);
  }

  var page = document.body.getAttribute("data-page") || "";

  function showContentError() {
    if (document.getElementById("content-error")) return;
    var main = document.querySelector("main");
    if (!main) return;
    var note = document.createElement("div");
    note.id = "content-error";
    note.className = "content-error";
    note.setAttribute("role", "alert");
    note.innerHTML =
      '<p>Couldn&rsquo;t load the latest site content.</p>' +
      '<button type="button" class="btn btn-orange sm" id="content-retry">Try again</button>';
    main.insertBefore(note, main.firstChild);
    var retry = document.getElementById("content-retry");
    if (retry) {
      retry.addEventListener("click", function () {
        window.location.reload();
      });
    }
  }

  function constructionModeOn(content) {
    var mode = ((content.site && content.site.constructionMode) || "no").toString().toLowerCase();
    return mode === "yes" || mode === "on" || mode === "1" || mode === "true";
  }

  function fetchConstructionAuth() {
    return fetch(appUrl("/api/construction-auth.php"), { cache: "no-store", credentials: "same-origin" })
      .then(function (r) {
        return r.json().then(function (data) {
          if (data && data.csrf) {
            window.__vsaConstructionCsrf = data.csrf;
          }
          return { ok: r.ok, data: data || {} };
        });
      })
      .catch(function () {
        return { ok: false, data: {} };
      });
  }

  function constructionCsrfHeaders() {
    var headers = { "Content-Type": "application/json" };
    if (window.__vsaConstructionCsrf) {
      headers["X-CSRF-Token"] = window.__vsaConstructionCsrf;
    }
    return headers;
  }

  function showConstructionPreviewBanner(auth) {
    if (document.querySelector("[data-construction-banner]")) return;
    var bar = document.createElement("div");
    bar.className = "construction-preview-banner";
    bar.setAttribute("data-construction-banner", "");
    var who = (auth && auth.username) || "admin";
    bar.innerHTML =
      '<button type="button" class="construction-preview-tab" data-construction-banner-open>' +
      '<span class="construction-preview-dot" aria-hidden="true"></span>' +
      "<span>Under construction — viewing as " +
      escapeHtml(who) +
      "</span>" +
      "</button>" +
      '<div class="construction-preview-menu hidden" data-construction-banner-menu hidden>' +
      '<p class="construction-preview-menu-lead">You’re previewing the live site while construction mode is on. Returning to the construction screen keeps your admin console session signed in.</p>' +
      '<button type="button" class="btn btn-orange sm" data-construction-preview-logout>Show construction screen</button>' +
      '<button type="button" class="btn-ghost construction-preview-dismiss" data-construction-banner-close>Keep viewing</button>' +
      "</div>";
    document.body.appendChild(bar);
    document.body.classList.add("construction-preview");

    var menu = bar.querySelector("[data-construction-banner-menu]");
    var openBtn = bar.querySelector("[data-construction-banner-open]");
    function openMenu() {
      menu.classList.remove("hidden");
      menu.removeAttribute("hidden");
      bar.classList.add("is-open");
    }
    function closeMenu() {
      menu.classList.add("hidden");
      menu.setAttribute("hidden", "");
      bar.classList.remove("is-open");
    }
    openBtn.addEventListener("click", function () {
      if (bar.classList.contains("is-open")) closeMenu();
      else openMenu();
    });
    bar.querySelector("[data-construction-banner-close]").addEventListener("click", closeMenu);
    bar.querySelector("[data-construction-preview-logout]").addEventListener("click", function () {
      fetch(appUrl("/api/construction-auth.php"), {
        method: "POST",
        credentials: "same-origin",
        headers: constructionCsrfHeaders(),
        body: JSON.stringify({ action: "logout", csrf: window.__vsaConstructionCsrf || "" }),
      }).finally(function () {
        window.location.reload();
      });
    });
  }

  function initConstructionGate(content, auth) {
    auth = auth || {};
    if (!constructionModeOn(content)) return;
    if (auth.preview) {
      showConstructionPreviewBanner(auth);
      return;
    }
    if (document.querySelector("[data-construction-sheet]")) return;

    var title =
      (content.site && content.site.constructionTitle) || "We'll be back soon";
    var bodyText =
      (content.site && content.site.constructionBody) ||
      "This site is temporarily unavailable. Please check back soon.";

    var sheet = document.createElement("div");
    sheet.className = "construction-sheet faq-sheet";
    sheet.setAttribute("data-construction-sheet", "");
    sheet.setAttribute("aria-hidden", "false");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-labelledby", "construction-sheet-title");
    sheet.innerHTML =
      '<div class="construction-sheet-backdrop faq-sheet-backdrop" tabindex="-1"></div>' +
      '<div class="construction-sheet-panel faq-sheet-panel" role="document">' +
      '  <header class="faq-sheet-head">' +
      '    <h2 id="construction-sheet-title"></h2>' +
      "  </header>" +
      '  <div class="faq-sheet-form construction-gate-body">' +
      '    <p class="faq-sheet-lead" data-construction-lead></p>' +
      '    <div data-construction-visitor>' +
      '      <form data-construction-form>' +
      '        <label class="faq-sheet-field">' +
      '          <span class="faq-sheet-label">Message <span class="req">*</span></span>' +
      '          <textarea name="message" rows="4" required maxlength="2000" placeholder="Leave a note for the VSA team…"></textarea>' +
      "        </label>" +
      '        <div class="faq-sheet-row">' +
      '          <label class="faq-sheet-field">' +
      '            <span class="faq-sheet-label">Name <span class="opt">(optional)</span></span>' +
      '            <input name="name" type="text" maxlength="80" autocomplete="name" placeholder="Your name">' +
      "          </label>" +
      '          <label class="faq-sheet-field">' +
      '            <span class="faq-sheet-label">Email <span class="opt">(optional)</span></span>' +
      '            <input name="email" type="email" maxlength="120" autocomplete="email" placeholder="you@example.com">' +
      "          </label>" +
      "        </div>" +
      '        <input class="faq-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '        <p data-construction-msg class="faq-sheet-msg hidden" role="status"></p>' +
      '        <div class="faq-sheet-actions">' +
      '          <button type="submit" class="btn btn-orange" data-construction-submit>Send message</button>' +
      "        </div>" +
      "      </form>" +
      '      <p class="construction-admin-link-wrap"><button type="button" class="construction-admin-link" data-construction-show-login>Admin sign in</button></p>' +
      "    </div>" +
      '    <div class="construction-admin-login hidden" data-construction-admin hidden>' +
      '      <p class="faq-sheet-lead" data-construction-admin-lead>Sign in to preview the site while construction mode is on.</p>' +
      '      <div data-construction-resume-wrap class="hidden" hidden>' +
      '        <div class="faq-sheet-actions">' +
      '          <button type="button" class="btn btn-outline-navy" data-construction-back-visitor>Back</button>' +
      '          <button type="button" class="btn btn-orange" data-construction-resume>Continue preview</button>' +
      "        </div>" +
      "      </div>" +
      '      <form data-construction-login>' +
      '        <label class="faq-sheet-field">' +
      '          <span class="faq-sheet-label">Username</span>' +
      '          <input name="username" type="text" required autocomplete="username" value="admin">' +
      "        </label>" +
      '        <label class="faq-sheet-field">' +
      '          <span class="faq-sheet-label">Password</span>' +
      '          <div class="users-pass-wrap construction-pass-wrap">' +
      '            <input name="password" type="password" required autocomplete="current-password">' +
      '            <button type="button" class="users-pass-toggle" data-construction-pass-toggle title="Hold to show password">Show</button>' +
      "          </div>" +
      "        </label>" +
      '        <input class="faq-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '        <p data-construction-login-msg class="faq-sheet-msg hidden" role="status"></p>' +
      '        <div class="faq-sheet-actions">' +
      '          <button type="button" class="btn btn-outline-navy" data-construction-back-visitor>Back</button>' +
      '          <button type="submit" class="btn btn-orange" data-construction-login-submit>Sign in</button>' +
      "        </div>" +
      "      </form>" +
      "    </div>" +
      "  </div>" +
      "</div>";

    sheet.querySelector("#construction-sheet-title").textContent = title;
    sheet.querySelector("[data-construction-lead]").textContent = bodyText;
    document.body.appendChild(sheet);
    document.body.classList.add("construction-lock", "faq-sheet-lock", "event-sheet-lock");

    requestAnimationFrame(function () {
      sheet.classList.add("is-open");
    });

    var visitorBox = sheet.querySelector("[data-construction-visitor]");
    var adminBox = sheet.querySelector("[data-construction-admin]");
    var form = sheet.querySelector("[data-construction-form]");
    var loginForm = sheet.querySelector("[data-construction-login]");
    var resumeWrap = sheet.querySelector("[data-construction-resume-wrap]");
    var msg = sheet.querySelector("[data-construction-msg]");
    var loginMsg = sheet.querySelector("[data-construction-login-msg]");
    var submitBtn = sheet.querySelector("[data-construction-submit]");
    var loginBtn = sheet.querySelector("[data-construction-login-submit]");
    var adminLead = sheet.querySelector("[data-construction-admin-lead]");

    function showAdmin() {
      visitorBox.classList.add("hidden");
      adminBox.classList.remove("hidden");
      adminBox.removeAttribute("hidden");
      if (auth && auth.adminSession) {
        if (adminLead) {
          adminLead.textContent =
            "You’re already signed in as " +
            (auth.username || "admin") +
            ". Continue to preview the site.";
        }
        if (resumeWrap) {
          resumeWrap.classList.remove("hidden");
          resumeWrap.removeAttribute("hidden");
        }
        if (loginForm) loginForm.classList.add("hidden");
      } else {
        if (adminLead) {
          adminLead.textContent = "Sign in to preview the site while construction mode is on.";
        }
        if (resumeWrap) {
          resumeWrap.classList.add("hidden");
          resumeWrap.setAttribute("hidden", "");
        }
        if (loginForm) loginForm.classList.remove("hidden");
        var u = loginForm.querySelector('[name="username"]');
        if (u) u.focus();
      }
    }
    function showVisitor() {
      adminBox.classList.add("hidden");
      adminBox.setAttribute("hidden", "");
      visitorBox.classList.remove("hidden");
    }
    sheet.querySelector("[data-construction-show-login]").addEventListener("click", showAdmin);
    sheet.querySelectorAll("[data-construction-back-visitor]").forEach(function (btn) {
      btn.addEventListener("click", showVisitor);
    });

    var resumeBtn = sheet.querySelector("[data-construction-resume]");
    if (resumeBtn) {
      resumeBtn.addEventListener("click", function () {
        resumeBtn.disabled = true;
        fetch(appUrl("/api/construction-auth.php"), {
          method: "POST",
          credentials: "same-origin",
          headers: constructionCsrfHeaders(),
          body: JSON.stringify({ action: "resume", csrf: window.__vsaConstructionCsrf || "" }),
        })
          .then(function (r) {
            return r.json().then(function (data) {
              if (data && data.csrf) window.__vsaConstructionCsrf = data.csrf;
              return { ok: r.ok, data: data };
            });
          })
          .then(function (res) {
            if (res.ok && res.data && res.data.ok) {
              window.location.reload();
              return;
            }
            alert((res.data && res.data.error) || "Could not resume preview.");
            resumeBtn.disabled = false;
          })
          .catch(function () {
            alert("Could not resume preview.");
            resumeBtn.disabled = false;
          });
      });
    }

    var passInput = loginForm.querySelector('[name="password"]');
    var passToggle = sheet.querySelector("[data-construction-pass-toggle]");
    if (passInput && passToggle) {
      function hidePass() {
        passInput.type = "password";
        passToggle.textContent = "Show";
      }
      function showPass() {
        passInput.type = "text";
        passToggle.textContent = "Hide";
      }
      passToggle.addEventListener("mousedown", function (e) {
        e.preventDefault();
        showPass();
      });
      passToggle.addEventListener("mouseup", hidePass);
      passToggle.addEventListener("mouseleave", hidePass);
      passToggle.addEventListener(
        "touchstart",
        function (e) {
          e.preventDefault();
          showPass();
        },
        { passive: false },
      );
      passToggle.addEventListener("touchend", hidePass);
      passToggle.addEventListener("touchcancel", hidePass);
      passToggle.addEventListener("blur", hidePass);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var message = form.querySelector('[name="message"]');
      var name = form.querySelector('[name="name"]');
      var email = form.querySelector('[name="email"]');
      var hp = form.querySelector('[name="website"]');
      if (!message || !msg) return;
      msg.classList.remove("hidden", "is-error", "is-ok");
      msg.textContent = "Sending…";
      if (submitBtn) submitBtn.disabled = true;
      fetch(appUrl("/api/construction-message.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.value.trim(),
          name: name ? name.value.trim() : "",
          email: email ? email.value.trim() : "",
          website: hp ? hp.value : "",
        }),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          if (res.ok && res.data && res.data.ok) {
            msg.classList.add("is-ok");
            msg.textContent = res.data.message || "Thanks! We received your message.";
            form.reset();
          } else {
            msg.classList.add("is-error");
            msg.textContent =
              (res.data && res.data.error) || "Could not send. Please try again later.";
          }
        })
        .catch(function () {
          msg.classList.add("is-error");
          msg.textContent = "Could not send. Please try again later.";
        })
        .then(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });

    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var username = loginForm.querySelector('[name="username"]');
      var password = loginForm.querySelector('[name="password"]');
      var hp = loginForm.querySelector('[name="website"]');
      if (!username || !password || !loginMsg) return;
      loginMsg.classList.remove("hidden", "is-error", "is-ok");
      loginMsg.textContent = "Signing in…";
      if (loginBtn) loginBtn.disabled = true;
      fetch(appUrl("/api/construction-auth.php"), {
        method: "POST",
        credentials: "same-origin",
        headers: constructionCsrfHeaders(),
        body: JSON.stringify({
          action: "login",
          username: username.value.trim(),
          password: password.value,
          website: hp ? hp.value : "",
          csrf: window.__vsaConstructionCsrf || "",
        }),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            if (data && data.csrf) window.__vsaConstructionCsrf = data.csrf;
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          if (res.ok && res.data && res.data.ok && res.data.preview) {
            window.location.reload();
            return;
          }
          loginMsg.classList.add("is-error");
          loginMsg.textContent =
            (res.data && res.data.error) || "Could not sign in.";
        })
        .catch(function () {
          loginMsg.classList.add("is-error");
          loginMsg.textContent = "Could not sign in. Try again.";
        })
        .then(function () {
          if (loginBtn) loginBtn.disabled = false;
        });
    });

    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key === "Escape" && document.body.classList.contains("construction-lock")) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );
  }

  function fetchContentJson() {
    return fetch(appUrl("/api/content.php"), { cache: "no-store", credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error("content fetch failed");
      return r.json();
    });
  }

  fetchContentJson()
    .then(function (content) {
      var err = document.getElementById("content-error");
      if (err) err.remove();

      function hydrate(payload) {
        applyPageSeo(payload);
        fillChrome(payload);
        if (page === "home") renderHome(payload);
        else if (page === "team") {
          renderTeam(payload);
          initTeamEffects(payload);
        } else if (page === "events") renderEvents(payload);
        else if (page === "royale") renderRoyale(payload);
        else if (page === "gallery") renderGallery(payload);
        else if (page === "merch") renderMerch(payload);
        else if (page === "faqs") renderFaqs(payload);
      }

      if (!constructionModeOn(content)) {
        hydrate(content);
        return;
      }

      // Unsubscribe must stay usable while construction mode gates the rest of the site.
      if (page === "unsubscribe") {
        hydrate(content);
        return;
      }

      // Resolve preview auth before any lock/blur so admin page swaps stay seamless.
      return fetchConstructionAuth().then(function (res) {
        var auth = res.data || {};
        if (auth.preview) {
          var ready = content._constructionRestricted
            ? fetchContentJson()
            : Promise.resolve(content);
          return ready.then(function (full) {
            hydrate(full);
            showConstructionPreviewBanner(auth);
          });
        }
        // Visitors: gate only — do not hydrate CMS content under the overlay.
        // Still reconcile holiday + button style from the gate payload.
        applyHolidayTheme(content);
        applyButtonEffect(content);
        document.body.classList.add("construction-lock", "faq-sheet-lock", "event-sheet-lock");
        initConstructionGate(content, auth);
      });
    })
    .catch(function () {
      showContentError();
    });
})();

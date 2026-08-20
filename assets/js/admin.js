// Auburn VSA admin console — client-side CMS form engine.
// Renders editors from a schema over the embedded content and saves each section
// back to save.php. Images upload to upload.php.
// After editing this file, run: php tools/bump-assets.php --bump
// New CMS fields: update SECTION_DEFS here AND default_content() in includes/content.php.
// parseYouTubeId / parseVimeoId are duplicated in assets/js/site.js — keep regexes in sync if you change them.
//
// Schema conventions (keep these when extending):
// - select options: string OR { value, label } (use selectOptionValue / selectOptionLabel).
// - lists: optional emptyText; reorder: true shows drag hint only when 2+ items.
// - TEAM_TABS[].preview drives View page ↗ while on Team (follows active roster tab).
// - Page blurbs live on PAGES[].description; avoid repeating the same sentence in section-desc.
(function () {
  var ICONS = ["x", "instagram", "facebook", "youtube", "linkedin", "discord", "tiktok", "auinvolve", "snapchat", "threads", "whatsapp", "telegram", "reddit", "pinterest", "twitch", "spotify", "github", "email", "linktree", "link"];

  // Keep path data in sync with assets/js/site.js SOCIAL_PATHS / socialIcon.
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

  function socialIconSvg(icon) {
    if (icon === "auinvolve") {
      return (
        '<svg class="social-auinvolve" viewBox="0 0 52 24" fill="currentColor" aria-hidden="true">' +
        '<text x="1" y="11" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" letter-spacing="0.6">AU</text>' +
        '<text x="1" y="21" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="6.2" font-weight="700" letter-spacing="1.4">INVOLVE</text>' +
        "</svg>"
      );
    }
    var d = SOCIAL_PATHS[icon];
    if (!d) return "";
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + d + '"></path></svg>';
  }

  /** Shared CMS visibility — off keeps the item in data but hides it on the public site. */
  var VISIBLE_FIELD = {
    key: "visible",
    label: "Visible on site",
    type: "switch",
    on: "yes",
    off: "no",
    default: "yes",
    hint: "Off = inactive (kept in the CMS, hidden on the public site until you turn it back on).",
  };

  function itemIsVisible(item) {
    if (!item || typeof item !== "object") return true;
    var v = item.visible;
    if (v === false || v === 0 || v === "0") return false;
    if (typeof v === "string") {
      var s = v.trim().toLowerCase();
      if (s === "no" || s === "off" || s === "hidden" || s === "false") return false;
    }
    return true;
  }

  function memberFields() {
    return [
      { key: "role", label: "Title", type: "text" },
      { key: "name", label: "Full name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "bio", label: "Description (max 4 lines)", type: "textarea", rows: "4", maxLines: 4 },
      VISIBLE_FIELD,
      { key: "image", label: "Photo (portrait 3:4 recommended — use Free to drag borders)", type: "image", cropAspect: "free" },
    ];
  }

  var TEAM_TABS = [
    { key: "executiveBoard", label: "Executive Board", preview: "../executive-board" },
    { key: "royaleDirectors", label: "AU Royale Directors", preview: "../au-royale-directors" },
    { key: "techTeam", label: "Tech Team", preview: "../tech-team" },
  ];
  var teamTabKey = "executiveBoard";

  /** Select option: plain string, or { value, label }. */
  function selectOptionValue(opt) {
    if (opt && typeof opt === "object") return String(opt.value);
    return String(opt);
  }

  function selectOptionLabel(opt) {
    if (opt && typeof opt === "object") return String(opt.label != null ? opt.label : opt.value);
    return String(opt);
  }

  function teamPreviewHref() {
    for (var i = 0; i < TEAM_TABS.length; i++) {
      if (TEAM_TABS[i].key === teamTabKey) return TEAM_TABS[i].preview;
    }
    return "../executive-board";
  }

  function pagePreviewHref(page) {
    if (!page) return "";
    if (page.id === "team") return teamPreviewHref();
    return page.preview || "";
  }

  /** Shared listEditor flags from SECTION_DEFS section or list block. */
  function listEditorOptions(spec) {
    spec = spec || {};
    var opts = {};
    if (spec.reorder) opts.reorder = true;
    if (spec.emptyText) opts.emptyText = spec.emptyText;
    return opts;
  }

  // Content-key schemas (what save.php understands).
  var SECTION_DEFS = {
    branding: {
      key: "branding",
      label: "Logo",
      description: "Appears in the header and footer of every public page. Logo upload publishes ASAP.",
      fields: [
        {
          key: "logo",
          label: "Logo image",
          type: "image",
          skipAdjust: true,
          onUploaded: function (url) {
            if (!content.branding) content.branding = {};
            content.branding.logo = url || "";
            saveSection("branding", "site", false, { mode: "asap" })
              .then(function () {
                applyAdminLogo();
                var status = document.querySelector(".save-status");
                if (status) {
                  status.className = "save-status ok";
                  status.textContent = url ? "Logo published." : "Logo cleared.";
                }
              })
              .catch(function (err) {
                alert(
                  (err && err.message) ||
                    "Logo file uploaded, but publish failed. Click Save Site.",
                );
              });
          },
        },
      ],
    },
    music: {
      key: "music",
      label: "Footer-logo music",
      description:
        "Hidden player unlocked by clicking the footer logo. Rename tracks with the Title field. Upload MP3 / M4A / OGG / WAV (max 25 MB).",
      fields: [
        {
          key: "enabled",
          label: "Enable easter egg",
          hint: "Off = logo clicks do nothing. On = count clicks, then show the player (stays unlocked in this browser).",
          type: "switch",
          on: "yes",
          off: "no",
        },
        {
          key: "clickCount",
          label: "Logo clicks to unlock",
          type: "select",
          options: ["3", "5", "7", "10"],
        },
        {
          key: "tracks",
          label: "Tracks",
          type: "list",
          itemLabel: "Track",
          item: [
            { key: "title", label: "Title (display name)", type: "text" },
            { key: "artist", label: "Artist", type: "text" },
            { key: "src", label: "Audio file", type: "audio" },
          ],
        },
      ],
    },
    site: {
      key: "site",
      label: "Site settings",
      description:
        "Grouped below — click a section to expand. Newsletter and unsubscribe copy sit with the other site settings.",
      fields: [
        {
          group: "Construction mode",
          key: "constructionMode",
          label: "Construction mode",
          hint: "Blurs the public site and shows a come-back-soon popup with a message form.",
          type: "switch",
          on: "yes",
          off: "no",
        },
        {
          group: "Construction mode",
          key: "constructionTitle",
          label: "Popup title",
          type: "text",
        },
        {
          group: "Construction mode",
          key: "constructionBody",
          label: "Popup message",
          type: "textarea",
        },
        {
          group: "Organization & contact",
          key: "orgName",
          label: "Organization name",
          type: "text",
        },
        { group: "Organization & contact", key: "university", label: "University", type: "text" },
        { group: "Organization & contact", key: "email", label: "Contact email", type: "text" },
        {
          group: "Organization & contact",
          key: "phone",
          label: "Contact phone",
          type: "phone",
          formatKey: "phoneCustomFormat",
          hint: "Auto-formats as (334) 555-1234. Turn on custom format to type it yourself.",
        },
        {
          group: "Organization & contact",
          key: "publicBaseUrl",
          label: "Public site URL (SEO / link previews)",
          type: "text",
          placeholder: "https://your-domain.com",
        },
        {
          group: "Look & motion",
          key: "holidayTheme",
          label: "Holiday theme",
          hint: "Auto follows the visitor’s local calendar. Off turns it off. Or force one theme anytime.",
          moreInfo: "holidayTheme",
          type: "select",
          options: [
            { value: "auto", label: "Auto (calendar)" },
            { value: "off", label: "Off" },
            { value: "halloween", label: "Halloween" },
            { value: "christmas", label: "Christmas" },
            { value: "july4", label: "July 4th" },
            { value: "valentines", label: "Valentine’s Day" },
            { value: "newyear", label: "Chinese New Year" },
            { value: "stpatricks", label: "St. Patrick’s Day" },
          ],
        },
        {
          group: "Look & motion",
          key: "buttonEffect",
          label: "Button hover effect",
          hint: "Sitewide look for Join / outline buttons. Lift is the default.",
          type: "select",
          options: [
            { value: "flat", label: "Flat — color only" },
            { value: "lift", label: "Lift — rise + soft shadow (default)" },
            { value: "shine", label: "Shine — lift + light streak" },
            { value: "jelly", label: "Jelly — springy bounce" },
            { value: "playful", label: "Playful — comic / kid vibe" },
            { value: "pop", label: "Pop — bold scale + shadow bloom" },
            { value: "pulse", label: "Pulse — expanding soft ring" },
            { value: "fill", label: "Fill — wipe / solid fill" },
            { value: "neon", label: "Neon — soft brand glow" },
            { value: "wiggle", label: "Wiggle — playful shake" },
          ],
        },
        {
          group: "Look & motion",
          key: "slideshowSeconds",
          label: "Highlights & showcase speed (seconds per slide)",
          type: "select",
          options: ["1", "2", "3", "4", "5", "6", "8"],
        },
        {
          group: "Look & motion",
          key: "alumniIdleSeconds",
          label: "Alumni row — resume auto-scroll after idle (seconds)",
          hint: "Home “Where we are now”: pauses when someone uses arrows or opens a card, then resumes after this many idle seconds.",
          type: "select",
          options: ["3", "5", "8", "10", "15", "20", "30"],
        },
        {
          group: "Look & motion",
          key: "alumniStepMs",
          label: "Alumni row — arrow swipe speed (ms)",
          hint: "How long each manual arrow step takes. Lower is faster (150 = snappy, 350 = slower).",
          type: "select",
          options: ["150", "180", "220", "280", "350"],
        },
        {
          group: "Newsletter & footer",
          key: "newsletterHeading",
          label: "Newsletter heading",
          type: "text",
        },
        {
          group: "Newsletter & footer",
          key: "newsletterTagline",
          label: "Newsletter tagline",
          type: "textarea",
        },
        {
          group: "Newsletter & footer",
          key: "newsletterEmailLabel",
          label: "Newsletter email field label",
          type: "text",
        },
        {
          group: "Newsletter & footer",
          key: "newsletterButton",
          label: "Subscribe button label",
          type: "text",
        },
        {
          group: "Newsletter & footer",
          key: "contactEmailLabel",
          label: "Email label (top bar & footer)",
          type: "text",
          hint: "Include the colon if you want it, e.g. Email:",
        },
        {
          group: "Newsletter & footer",
          key: "contactPhoneLabel",
          label: "Phone label (top bar & footer)",
          type: "text",
          hint: "Include the colon if you want it, e.g. Phone:",
        },
        {
          group: "Newsletter & footer",
          key: "unsubscribeLinkLabel",
          label: "Footer Unsubscribe link",
          type: "text",
        },
        {
          group: "Newsletter & footer",
          key: "skipLinkLabel",
          label: "Skip to content link",
          type: "text",
        },
        {
          group: "Navigation labels",
          key: "navHome",
          label: "Home",
          type: "text",
        },
        {
          group: "Navigation labels",
          key: "navAbout",
          label: "About",
          type: "text",
        },
        {
          group: "Navigation labels",
          key: "navExecutiveBoard",
          label: "Executive Board",
          type: "text",
        },
        {
          group: "Navigation labels",
          key: "navRoyaleDirectors",
          label: "AU Royale Directors",
          type: "text",
        },
        {
          group: "Navigation labels",
          key: "navTechTeam",
          label: "Tech Team",
          type: "text",
        },
        {
          group: "Navigation labels",
          key: "navEvents",
          label: "Events",
          type: "text",
        },
        {
          group: "Navigation labels",
          key: "navRoyale",
          label: "AU Royale",
          type: "text",
        },
        {
          group: "Navigation labels",
          key: "navGallery",
          label: "Gallery",
          type: "text",
        },
        {
          group: "Navigation labels",
          key: "navMerch",
          label: "Merch",
          type: "text",
        },
        {
          group: "Navigation labels",
          key: "navFaqs",
          label: "FAQs",
          type: "text",
        },
        {
          group: "Newsletter & footer",
          key: "footerCopyright",
          label: "Footer copyright (after © year)",
          type: "text",
          hint: "Year is filled automatically.",
        },
        {
          group: "Unsubscribe page",
          key: "unsubscribeKicker",
          label: "Kicker",
          type: "text",
        },
        {
          group: "Unsubscribe page",
          key: "unsubscribeHeading",
          label: "Heading",
          type: "text",
        },
        {
          group: "Unsubscribe page",
          key: "unsubscribeLead",
          label: "Lead text",
          type: "textarea",
        },
        {
          group: "Unsubscribe page",
          key: "unsubscribeConfirmButton",
          label: "Confirm button",
          type: "text",
        },
        {
          group: "Unsubscribe page",
          key: "unsubscribeRequestButton",
          label: "Request button",
          type: "text",
        },
        {
          group: "Unsubscribe page",
          key: "unsubscribeNote",
          label: "Note under form",
          type: "textarea",
        },
      ],
    },
    socials: {
      key: "socials",
      label: "Social links",
      description: "Footer icons. Empty URL = hidden. Drag to reorder.",
      root: "array",
      itemLabel: "Social link",
      itemFields: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "URL", type: "text" },
        { key: "icon", label: "Built-in icon", type: "select", options: ICONS },
        {
          key: "image",
          label: "Custom icon",
          type: "socialIcon",
          hint: "Upload any logo — it is converted to a navy silhouette to match the built-in set. Clear to use the built-in icon again.",
        },
        VISIBLE_FIELD,
      ],
    },
    home: {
      key: "home",
      label: "Home content",
      description: "Click a section to expand. Lists (Why Join, steps, photos, Instagram, alumni) are folded too.",
      fields: [
        {
          group: "Hero",
          key: "heroWelcome",
          label: "Welcome line",
          type: "text",
        },
        { group: "Hero", key: "heroTitle", label: "Title", type: "text" },
        {
          group: "Hero",
          key: "heroBrief",
          label: "Briefing",
          type: "textarea",
          hint: "Invite-forward: who can join + what to do next.",
        },
        {
          group: "Hero",
          key: "heroImage",
          label: "Group photo",
          type: "image",
          maxEdge: 2560,
          hint: "Full-bleed on large screens — upload at least ~2400px wide (max 2560) for a sharp look. Re-upload after changing this if the current file looks soft.",
        },
        {
          group: "Hero",
          key: "joinPathHint",
          label: "Join path (under buttons)",
          type: "text",
          hint: "Short line like “Join on AUinvolve → follow IG → come to a meeting.” Empty hides it.",
        },
        { group: "Hero", key: "heroJoinLabel", label: "Join button label", type: "text" },
        { group: "Hero", key: "heroIgLabel", label: "Instagram button label", type: "text" },
        {
          group: "About",
          key: "aboutHeading",
          label: "Heading",
          type: "text",
          hint: "Use | for orange words, e.g. About | Auburn VSA",
        },
        { group: "About", key: "aboutText", label: "Body text", type: "textarea" },
        { group: "About", key: "aboutJoinLabel", label: "Join button label", type: "text" },
        { group: "About", key: "aboutBoardLabel", label: "Meet the board button", type: "text" },
        {
          group: "Why Join labels",
          key: "whyJoinHeading",
          label: "Heading",
          type: "text",
          hint: "Use | for orange words, e.g. Why | Join VSA|?",
        },
        { group: "Why Join labels", key: "whyJoinCtaLabel", label: "CTA button", type: "text" },
        {
          group: "How to join labels",
          key: "howToJoinHeading",
          label: "Heading",
          type: "text",
          hint: "Use | for orange words, e.g. How to | join",
        },
        { group: "How to join labels", key: "howToJoinCtaLabel", label: "Join button", type: "text" },
        { group: "How to join labels", key: "howToJoinFaqsLabel", label: "FAQs button", type: "text" },
        {
          group: "Instagram labels",
          key: "instagramHeading",
          label: "Heading",
          type: "text",
          hint: "Use | for orange words, e.g. Latest from | @auburnvsa",
        },
        { group: "Instagram labels", key: "instagramSubtext", label: "Subtext", type: "text" },
        { group: "Instagram labels", key: "instagramButtonLabel", label: "Button label", type: "text" },
        {
          group: "Alumni labels",
          key: "alumniHeading",
          label: "Heading",
          type: "text",
          hint: "Use | for orange words, e.g. Where we are | now",
        },
        { group: "Alumni labels", key: "alumniSubtext", label: "Subtext", type: "text" },
        {
          group: "Bottom CTA & sticky Join",
          key: "ctaHeading",
          label: "CTA heading",
          type: "text",
          hint: "Use | around orange words: Find your |community|. Celebrate your |culture|.",
        },
        {
          group: "Bottom CTA & sticky Join",
          key: "ctaText",
          label: "CTA body",
          type: "textarea",
          hint: "Keep it short and action-oriented.",
        },
        { group: "Bottom CTA & sticky Join", key: "ctaJoinLabel", label: "Join button", type: "text" },
        { group: "Bottom CTA & sticky Join", key: "ctaIgLabel", label: "Instagram button", type: "text" },
        {
          group: "Bottom CTA & sticky Join",
          key: "stickyJoin",
          label: "Mobile sticky Join bar",
          hint: "Shows a Join chip at the bottom on phones (Home only). Visitors can dismiss it for the tab session.",
          type: "switch",
          on: "yes",
          off: "no",
        },
        { group: "Bottom CTA & sticky Join", key: "stickyJoinLabel", label: "Sticky Join label", type: "text" },
        {
          group: "Next-up strip & empty states",
          key: "nextUpLabel",
          label: "Next-up label",
          type: "text",
        },
        {
          group: "Next-up strip & empty states",
          key: "nextUpDetailsLabel",
          label: "Event details button",
          type: "text",
        },
        {
          group: "Next-up strip & empty states",
          key: "nextUpGcalLabel",
          label: "Add to Google Calendar button",
          type: "text",
        },
        {
          group: "Next-up strip & empty states",
          key: "nextUpIcsLabel",
          label: "Download .ics button",
          type: "text",
        },
        {
          group: "Next-up strip & empty states",
          key: "nextUpViewEventsLabel",
          label: "View all events (when no calendar link)",
          type: "text",
        },
        {
          group: "Next-up strip & empty states",
          key: "nextUpJoinLabel",
          label: "Home Join invite (next to event actions)",
          type: "text",
          hint: "Only on the Home page next-up strip.",
        },
        {
          group: "Next-up strip & empty states",
          key: "recentEmptyText",
          label: "Recent events empty message",
          type: "textarea",
          hint: "Shown in the top slideshow area when no home events have photos yet.",
        },
        {
          group: "Next-up strip & empty states",
          key: "orgEmptyLabel",
          label: "Organization photos empty label",
          type: "text",
        },
      ],
      lists: [
        {
          key: "whyJoin",
          label: "Why Join columns",
          itemLabel: "Column",
          item: [
            { key: "title", label: "Column title", type: "text", hint: "e.g. Culture, Growth, Community" },
            { key: "body", label: "Description", type: "textarea" },
            {
              key: "image",
              label: "Photo for this column",
              type: "image",
              cropAspect: "16:9",
              hint: "Shown under this column on the home page (16:9 landscape preferred).",
            },
            VISIBLE_FIELD,
          ],
        },
        {
          key: "howToJoinSteps",
          label: "How to join — steps",
          itemLabel: "Step",
          emptyText: "Add 2–4 short steps (AUinvolve → Instagram → meeting).",
          item: [
            { key: "title", label: "Step title", type: "text" },
            { key: "body", label: "Step detail", type: "textarea" },
            VISIBLE_FIELD,
          ],
        },
        {
          key: "galleryImages",
          label: "Organization pictures (slideshow)",
          itemLabel: "Picture",
          item: [
            { key: "image", label: "Image", type: "image" },
            { key: "name", label: "Title / caption (optional)", type: "text" },
            { key: "link", label: "Link (optional)", type: "text" },
            VISIBLE_FIELD,
          ],
        },
        {
          key: "instagramPosts",
          label: "Instagram posts",
          itemLabel: "Post",
          item: [
            {
              key: "url",
              label: "Instagram post URL",
              type: "text",
              hint: "Use your own photos or Instagram links — no AI images.",
            },
            { key: "image", label: "Preview image (upload your photo)", type: "image" },
            { key: "caption", label: "Caption (optional)", type: "text" },
            VISIBLE_FIELD,
          ],
        },
        {
          key: "alumni",
          label: "Where we are now (alumni)",
          itemLabel: "Alumni",
          item: [
            { key: "name", label: "Name", type: "text" },
            {
              key: "jobTitle",
              label: "Title (shown on the home row)",
              type: "text",
              hint: "Job / role title under the name on “Where we are now” cards (e.g. Software Engineer, CEO).",
            },
            { key: "year", label: "Grad year", type: "text" },
            {
              key: "note",
              label: "Employer / city note (optional)",
              type: "text",
              hint: "Extra line in the detail popup. Also used on the home card if Title is empty.",
            },
            {
              key: "description",
              label: "Full description (shown in popup)",
              type: "textarea",
              rows: 4,
            },
            { key: "image", label: "Photo (optional — your upload)", type: "image" },
            VISIBLE_FIELD,
          ],
        },
      ],
    },
    team: {
      key: "team",
      label: "Team members",
      description: "These feed the Executive Board, AU Royale Directors, and Tech Team pages.",
      type: "teamRoster",
    },
    events: {
      key: "events",
      label: "Events",
      description: "Click a section to expand. Event cards live in their own group below.",
      fields: [
        {
          group: "Google Calendar",
          key: "calendarUrl",
          label: "Calendar URL",
          type: "text",
          hint: "Public or embed link (calendar.google.com). Shown as an in-page calendar on Events (plus Open Google Calendar). Calendar must be public. Leave blank to hide.",
        },
        { group: "Google Calendar", key: "calendarKicker", label: "Card kicker", type: "text" },
        { group: "Google Calendar", key: "calendarTitle", label: "Card title", type: "text" },
        {
          group: "Google Calendar",
          key: "calendarButtonLabel",
          label: "Open full calendar button",
          type: "text",
        },
        { group: "Page labels", key: "pageHeading", label: "Page heading", type: "text" },
        { group: "Page labels", key: "viewAllLabel", label: "View all events button", type: "text" },
        {
          group: "Page labels",
          key: "upcomingHeading",
          label: "Upcoming section heading",
          type: "text",
        },
        { group: "Page labels", key: "allModalTitle", label: "All-events popup title", type: "text" },
      ],
      lists: [
        {
          key: "upcoming",
          label: "Event cards",
          itemLabel: "Event",
          item: [
            { key: "name", label: "Name", type: "text" },
            { key: "date", label: "When", type: "eventWhen" },
            { key: "location", label: "Location", type: "text" },
            {
              key: "description",
              label: "Description (shown in the event popup)",
              type: "textarea",
              rows: 5,
            },
            { key: "image", label: "Image", type: "image" },
            { key: "link", label: "Link (tickets / Instagram / etc. — button in popup)", type: "text" },
            {
              key: "showOnHome",
              label: "Show on home Recent Events",
              type: "switch",
              on: "yes",
              off: "no",
              default: "no",
            },
            VISIBLE_FIELD,
          ],
        },
      ],
    },
    royale: {
      key: "royale",
      label: "AU Royale content",
      description: "Click a section to expand. Sponsors slideshow is in its own group.",
      fields: [
        { group: "Hero & event details", key: "heroTitle", label: "Hero title", type: "text" },
        {
          group: "Hero & event details",
          key: "heroSubtitle",
          label: "Hero subtitle (optional)",
          type: "text",
        },
        {
          group: "Hero & event details",
          key: "eventDate",
          label: "When",
          type: "eventWhen",
          presets: true,
        },
        {
          group: "Hero & event details",
          key: "eventLocation",
          label: "Event location",
          type: "text",
        },
        {
          group: "Hero & event details",
          key: "eventCost",
          label: "Ticket price label",
          type: "text",
        },
        {
          group: "About",
          key: "aboutHeading",
          label: "Heading",
          type: "text",
          hint: "Use | for orange words, e.g. About | Auburn Royale",
        },
        { group: "About", key: "introText", label: "About body", type: "textarea" },
        { group: "About", key: "expectHeading", label: "What to expect — heading", type: "text" },
        { group: "About", key: "expectText", label: "What to expect", type: "textarea" },
        { group: "About", key: "welcomeHeading", label: "Who’s welcome — heading", type: "text" },
        { group: "About", key: "welcomeText", label: "Who’s welcome", type: "textarea" },
        { group: "About", key: "shareButtonLabel", label: "Share button label", type: "text" },
        { group: "About", key: "copyButtonLabel", label: "Copy link button label", type: "text" },
        {
          group: "Video",
          key: "videoUrl",
          label: "Royale video",
          type: "video",
          hint: "Shows at the top of AU Royale, above the title/date hero. Paste a YouTube/Vimeo link or upload a file. Leave empty to hide the section.",
        },
        { group: "Video", key: "videoImage", label: "Video poster / thumbnail", type: "image" },
        {
          group: "Video",
          key: "videoHeading",
          label: "Heading",
          type: "text",
          hint: "Use | for orange words, e.g. Royale | in motion",
        },
        { group: "Video", key: "videoSubtext", label: "Subtext", type: "text" },
        {
          group: "Gallery highlights labels",
          key: "galleryHeading",
          label: "Heading",
          type: "text",
          hint: "Use | for orange words, e.g. Gallery | highlights",
        },
        {
          group: "Gallery highlights labels",
          key: "gallerySubtext",
          label: "Subtext",
          type: "text",
        },
        {
          group: "Gallery highlights labels",
          key: "galleryButtonLabel",
          label: "View full gallery button",
          type: "text",
        },
        {
          group: "Sponsors labels",
          key: "sponsorsHeading",
          label: "Heading",
          type: "text",
          hint: "Use | for orange words, e.g. Sponsors | & partners",
        },
        { group: "Sponsors labels", key: "sponsorsSubtext", label: "Subtext", type: "text" },
        { group: "Ticketing", key: "ticketingHeading", label: "Heading", type: "text" },
        {
          group: "Ticketing",
          key: "ticketingText",
          label: "Details",
          type: "textarea",
          hint: "Purchase how-to. Date and price above already show on the page — no need to repeat them here.",
        },
        { group: "Ticketing", key: "ticketsButtonLabel", label: "Purchase Tickets button", type: "text" },
      ],
      lists: [
        {
          key: "sponsorsImages",
          label: "Sponsors & partners (slideshow)",
          itemLabel: "Sponsor",
          item: [
            { key: "image", label: "Logo / image", type: "image" },
            { key: "link", label: "Link (optional)", type: "text" },
            { key: "name", label: "Name / caption (optional)", type: "text" },
            VISIBLE_FIELD,
          ],
        },
      ],
    },
    gallery: {
      key: "gallery",
      label: "Gallery content",
      description: "Pick a school year tab, then edit its video and albums. Click Edit on an album to open it in a popup.",
      type: "galleryYears",
    },
    merch: {
      key: "merch",
      label: "Merch content",
      description: "Click a section to expand.",
      fields: [
        { group: "Page labels", key: "pageHeading", label: "Page heading", type: "text" },
        { group: "Page labels", key: "pageLede", label: "Page intro", type: "textarea" },
        { group: "Page labels", key: "shopHeading", label: "Shop section heading", type: "text" },
      ],
      lists: [
        {
          key: "showcaseImages",
          label: "Showcase (slideshow)",
          itemLabel: "Slide",
          emptyText: "No showcase slides yet.",
          item: [
            { key: "image", label: "Image", type: "image" },
            { key: "link", label: "Link (optional)", type: "text" },
            { key: "name", label: "Caption (optional)", type: "text" },
            VISIBLE_FIELD,
          ],
        },
        {
          key: "products",
          label: "Products",
          itemLabel: "Product",
          emptyText: "No products yet.",
          item: [
            { key: "name", label: "Name", type: "text" },
            {
              key: "price",
              label: "Price",
              type: "text",
              softCurrencyPrefix: "$",
            },
            { key: "image", label: "Image", type: "image" },
            { key: "description", label: "Description", type: "textarea" },
            {
              key: "status",
              label: "Availability",
              type: "select",
              options: ["Available", "Coming soon", "Sold out"],
            },
            { key: "link", label: "Buy / shop link", type: "text" },
            VISIBLE_FIELD,
          ],
        },
      ],
    },
    faqPage: {
      key: "faqPage",
      label: "FAQs page labels",
      description: "Click a section to expand. Published Q&A is below.",
      fields: [
        { group: "Page heading", key: "pageHeading", label: "Heading", type: "text" },
        { group: "Ask CTA", key: "ctaKicker", label: "Kicker", type: "text" },
        { group: "Ask CTA", key: "ctaCopy", label: "Body", type: "textarea" },
        { group: "Ask CTA", key: "askButtonLabel", label: "Ask button label", type: "text" },
        { group: "Ask popup", key: "sheetTitle", label: "Title", type: "text" },
        { group: "Ask popup", key: "sheetLead", label: "Lead", type: "textarea" },
        { group: "Ask popup", key: "submitLabel", label: "Submit button", type: "text" },
      ],
    },
    faqs: {
      key: "faqs",
      label: "Published FAQs",
      description:
        "Live on the public FAQs page. Reorder with drag or ↑ ↓, then Save FAQs. New asks land in FAQ Inbox (Shared).",
      root: "array",
      reorder: true,
      itemLabel: "FAQ",
      emptyText: "No published FAQs yet. Add one here, or publish from FAQ Inbox.",
      itemFields: [
        { key: "question", label: "Question", type: "text" },
        { key: "answer", label: "Answer", type: "textarea" },
        VISIBLE_FIELD,
      ],
    },
    effects: {
      key: "effects",
      label: "Team page effects",
      description: "Optional decorations on Executive Board, Tech Team, and AU Royale Directors pages.",
      fields: [
        {
          group: "Decorations",
          key: "teamAccentLine",
          label: "Accent line on team pages",
          type: "select",
          options: [
            { value: "yes", label: "On" },
            { value: "no", label: "Off" },
          ],
        },
      ],
    },
  };

  // Page tabs — mirror the public site so you can jump straight to what you're looking at.
  var PAGES = [
    {
      id: "dashboard",
      label: "Dashboard",
      group: "",
      preview: "../",
      description: "Site status, what needs attention, and shortcuts to the most common tasks.",
      sections: [],
      dashboard: true,
    },
    {
      id: "site",
      label: "Site",
      group: "Shared",
      preview: "../",
      description: "Construction mode, logo, contact, look & motion, newsletter, and socials.",
      sections: ["branding", "site", "socials"],
    },
    {
      id: "faq-inbox",
      label: "FAQ Inbox",
      group: "Shared",
      preview: "../faqs",
      description: "Questions from the public Ask form. Answer & publish, or dismiss.",
      sections: [],
      faqInbox: true,
    },
    {
      id: "messages",
      label: "Messages",
      group: "Shared",
      preview: "../",
      description:
        "Construction visitor notes and security alerts (logins, lockouts, unsubscribe cooldowns).",
      sections: [],
      messages: true,
    },
    {
      id: "blocked-ips",
      label: "Blocked IPs",
      group: "Shared",
      preview: "../",
      description:
        "Site blocks (spam / failed logins / manual) and unsubscribe cooldowns. Expand a row to edit or clear.",
      sections: [],
      blockedIps: true,
    },
    {
      id: "subscribers",
      label: "Newsletter",
      group: "Shared",
      preview: "../",
      description: "Pending unsubscribes, monthly compose for Gmail, then subscriber CSV / BCC.",
      sections: [],
      subscribers: true,
    },
    {
      id: "mail",
      label: "Mail",
      group: "Shared",
      preview: "../",
      description: "info@ and sale@ inbox. Open a message to reply via the club Gmail.",
      sections: [],
      mail: true,
    },
    {
      id: "publish",
      label: "Publish",
      group: "Shared",
      preview: "../",
      description: "Cancel scheduled publishes. Saving a page still opens ASAP or Schedule.",
      sections: [],
      publishQueue: true,
    },
    {
      id: "media",
      label: "Media",
      group: "Shared",
      preview: "../",
      description: "All uploaded images. Click one to see where it is used on the site.",
      sections: [],
      mediaLibrary: true,
    },
    {
      id: "music",
      label: "Music",
      group: "Shared",
      preview: "../",
      description:
        "Footer-logo easter egg: visitors click the logo enough times to unlock a right-side music player.",
      sections: ["music"],
    },
    {
      id: "backup",
      label: "Backup",
      group: "Shared",
      preview: "../",
      description: "Download a full zip, or import a backup to restore this server (cannot be undone).",
      sections: [],
      backup: true,
    },
    {
      id: "users",
      label: "Manage users",
      group: "Shared",
      preview: "../",
      description: "Editor accounts, permissions, passwords. Root admin only.",
      sections: [],
      users: true,
    },
    {
      id: "activity",
      label: "Activity log",
      group: "Shared",
      preview: "../",
      description: "Audit trail of admin and public actions. Root admin only.",
      sections: [],
      activity: true,
    },
    {
      id: "home",
      label: "Home",
      group: "Pages",
      preview: "../",
      description: "Hero, about, why join, org pictures, Instagram, Where we are now, and home buttons.",
      sections: ["home"],
      linkFields: [
        { key: "learnMore", label: "Learn More button link", type: "text" },
        { key: "join", label: "Join Now button link", type: "text" },
      ],
    },
    {
      id: "team",
      label: "Team",
      group: "Pages",
      preview: "../executive-board",
      description: "Rosters and intros for Executive Board, AU Royale Directors, and Tech Team.",
      sections: ["team", "effects"],
    },
    {
      id: "events",
      label: "Events",
      group: "Pages",
      preview: "../events",
      description: "Event list, home carousel flags, Google Calendar embed, and detail fields.",
      sections: ["events"],
    },
    {
      id: "royale",
      label: "AU Royale",
      group: "Pages",
      preview: "../au-royale",
      description: "Hero, date/location, page sections, video, sponsors, and ticket button.",
      sections: ["royale"],
      linkFields: [
        { key: "purchaseTickets", label: "Purchase Tickets button link", type: "text" },
      ],
    },
    {
      id: "gallery",
      label: "Gallery",
      group: "Pages",
      preview: "../gallery",
      description: "School-year tabs, end-of-year video, and photo albums.",
      sections: ["gallery"],
    },
    {
      id: "merch",
      label: "Merch",
      group: "Pages",
      preview: "../merch",
      description: "Showcase slideshow and product grid (detail popup + Buy link).",
      sections: ["merch"],
    },
    {
      id: "faqs",
      label: "FAQs",
      group: "Pages",
      preview: "../faqs",
      description: "Published Q&A on the public FAQs page. New asks go to FAQ Inbox.",
      sections: ["faqPage", "faqs"],
    },
  ];

  var content = {};
  var ADMIN_USER = window.ADMIN_USER || { username: "admin", permissions: [], isRoot: true };
  var ADMIN_PERM_CATALOG = window.ADMIN_PERM_CATALOG || {};

  function userCan(pageId) {
    if (ADMIN_USER.isRoot) return true;
    var perms = ADMIN_USER.permissions || [];
    return perms.indexOf(pageId) !== -1;
  }

  function visiblePages() {
    return PAGES.filter(function (page) {
      if (page.id === "dashboard") return true;
      if (page.id === "users" || page.id === "activity") return !!ADMIN_USER.isRoot;
      // Publish queue: dedicated perm, or anyone who already edits pages.
      if (page.id === "publish") {
        if (userCan("publish") || userCan("backup") || userCan("site")) return true;
        var contentPages = ["home", "team", "events", "royale", "gallery", "merch", "faqs"];
        for (var i = 0; i < contentPages.length; i++) {
          if (userCan(contentPages[i])) return true;
        }
        return false;
      }
      // Media library: explicit perm, or anyone who edits site/content/backup.
      if (page.id === "media") {
        if (userCan("media") || userCan("site") || userCan("backup")) return true;
        var mediaPages = ["home", "team", "events", "royale", "gallery", "merch", "faqs"];
        for (var m = 0; m < mediaPages.length; m++) {
          if (userCan(mediaPages[m])) return true;
        }
        return false;
      }
      return userCan(page.id);
    });
  }
  var activePageId = "dashboard";

  /** Stroke icons for admin nav — keyed by page id. */
  var NAV_ICONS = {
    dashboard:
      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    site:
      '<circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    "faq-inbox":
      '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.25c-.7.4-1.1.8-1.1 1.75"/><path d="M12 16.2h.01"/>',
    messages:
      '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H6l-4 3V11.5A8.5 8.5 0 1 1 21 11.5z"/>',
    "blocked-ips":
      '<path d="M12 3l8 3.5v5.2c0 4.6-3.1 8.7-8 9.8-4.9-1.1-8-5.2-8-9.8V6.5L12 3z"/><path d="M9.5 12.2l1.8 1.8 3.7-3.8"/>',
    subscribers:
      '<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h6"/>',
    mail:
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>',
    publish:
      '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="M9 15h2M13 15h2"/>',
    media:
      '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="1.6"/><path d="M21 16l-5.5-5.5L8 18"/>',
    music:
      '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2.5"/><circle cx="17" cy="16" r="2.5"/>',
    backup:
      '<path d="M12 3v11"/><path d="M8 10l4 4 4-4"/><path d="M5 18h14"/>',
    users:
      '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.2 19a4.2 4.2 0 0 1 5.8-3.7"/>',
    activity:
      '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    home:
      '<path d="M4 11.5L12 4l8 7.5"/><path d="M6.5 10.5V20h11V10.5"/>',
    team:
      '<circle cx="12" cy="8" r="3"/><path d="M5 19a7 7 0 0 1 14 0"/>',
    events:
      '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    royale:
      '<path d="M5 16l2-8 5 4 5-4 2 8H5z"/><path d="M5 16h14v2.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5V16z"/>',
    gallery:
      '<rect x="3" y="5" width="11" height="9" rx="1.5"/><rect x="10" y="10" width="11" height="9" rx="1.5"/>',
    merch:
      '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    faqs:
      '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.7 2.2c-.8.5-1.3 1-1.3 2"/><path d="M12 17h.01"/>',
  };

  function navIcon(pageId) {
    var wrap = document.createElement("span");
    wrap.className = "admin-nav-icon-wrap";
    wrap.setAttribute("aria-hidden", "true");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "admin-nav-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.75");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.innerHTML = NAV_ICONS[pageId] || NAV_ICONS.dashboard;
    wrap.appendChild(svg);
    return wrap;
  }

  function pageAllowed(id) {
    var pages = visiblePages();
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].id === id) return true;
    }
    return false;
  }

  function getPage(id) {
    var pages = visiblePages();
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].id === id) return pages[i];
    }
    for (var j = 0; j < PAGES.length; j++) {
      if (PAGES[j].id === id) return PAGES[j];
    }
    return pages[0] || PAGES[0];
  }

  function pageSaveKeys(page) {
    var keys = (page.sections || []).slice();
    if (page.linkFields && page.linkFields.length) keys.push("links");
    return keys;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  // Uploaded/stored URLs are relative to the site root; the admin lives in
  // /admin/, so prefix "../" for previews of relative paths.
  function previewSrc(url) {
    if (!url) return "";
    var u = String(url).trim();
    if (!u) return "";
    var compact = u.toLowerCase().replace(/\s+/g, "");
    if (
      compact.indexOf("javascript:") === 0 ||
      compact.indexOf("data:") === 0 ||
      compact.indexOf("vbscript:") === 0 ||
      compact.indexOf("file:") === 0
    ) {
      return "";
    }
    if (u.indexOf("..") !== -1) return "";
    if (/^(https?:)?\/\//.test(u) || u.charAt(0) === "/") return u;
    return "../" + u;
  }

  function applyAdminLogo() {
    var logo = (content.branding && content.branding.logo) || "";
    var src = previewSrc(logo) || "";
    var img = document.getElementById("admin-brand-logo");
    if (img) {
      if (src) {
        img.setAttribute("src", src);
        img.removeAttribute("hidden");
      } else {
        img.removeAttribute("src");
        img.setAttribute("hidden", "");
      }
    }
    var favicon = document.querySelector('link[rel="icon"]');
    if (favicon && src) favicon.setAttribute("href", src);
  }

  function refreshCsrfToken() {
    return fetch("session.php", { cache: "no-store", credentials: "same-origin" }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok || !data || !data.ok || !data.csrf) {
          throw new Error((data && data.error) || "Session expired. Refresh the page and sign in again.");
        }
        window.CSRF_TOKEN = data.csrf;
        return data.csrf;
      });
    });
  }

  function uploadFile(file, onProgress, extraFields, isRetry) {
    return new Promise(function (resolve) {
      var fd = new FormData();
      fd.append("file", file);
      fd.append("csrf", window.CSRF_TOKEN || "");
      if (activePageId) fd.append("page", activePageId);
      if (extraFields && typeof extraFields === "object") {
        Object.keys(extraFields).forEach(function (k) {
          if (extraFields[k] != null && extraFields[k] !== "") {
            fd.append(k, String(extraFields[k]));
          }
        });
      }
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "upload.php");
      xhr.setRequestHeader("X-CSRF-Token", window.CSRF_TOKEN || "");

      if (xhr.upload && typeof onProgress === "function") {
        xhr.upload.addEventListener("progress", function (e) {
          if (!e.lengthComputable) {
            onProgress(null);
            return;
          }
          var pct = Math.max(0, Math.min(100, Math.round((e.loaded / e.total) * 100)));
          onProgress(pct);
        });
      }

      xhr.addEventListener("load", function () {
        var data = null;
        var raw = xhr.responseText || "";
        try {
          data = JSON.parse(raw);
        } catch (err) {
          data = null;
        }
        if (xhr.status >= 200 && xhr.status < 300 && data && data.ok && data.url) {
          if (typeof onProgress === "function") onProgress(100);
          resolve(data.url);
          return;
        }
        var msg =
          (data && data.error) ||
          (raw && raw.indexOf("{") === -1
            ? "Upload failed (server returned a non-JSON response)."
            : "Upload failed.");
        if (!isRetry && xhr.status === 403 && /csrf/i.test(msg)) {
          refreshCsrfToken()
            .then(function () {
              return uploadFile(file, onProgress, extraFields, true);
            })
            .then(resolve)
            .catch(function () {
              alert("Session token expired. Refresh the admin page, then try again.");
              resolve(undefined);
            });
          return;
        }
        alert(msg);
        resolve(undefined);
      });

      xhr.addEventListener("error", function () {
        alert("Upload failed (network error).");
        resolve(undefined);
      });

      xhr.addEventListener("abort", function () {
        resolve(undefined);
      });

      if (typeof onProgress === "function") onProgress(0);
      xhr.send(fd);
    });
  }

  function saveSection(sectionKey, pageId, isRetry, publishOpts) {
    var publish = publishOpts && typeof publishOpts === "object" ? publishOpts : { mode: "asap" };
    return fetch("save.php", {
      method: "POST",
      headers: { "content-type": "application/json", "X-CSRF-Token": window.CSRF_TOKEN || "" },
      credentials: "same-origin",
      body: JSON.stringify({
        section: sectionKey,
        value: content[sectionKey],
        page: pageId || activePageId,
        csrf: window.CSRF_TOKEN || "",
        publish: publish,
      }),
      cache: "no-store",
    }).then(function (r) {
      return r.text().then(function (text) {
        var data = null;
        try {
          data = JSON.parse(text || "{}");
        } catch (err) {
          throw new Error("Save failed for " + sectionKey + " (invalid server response).");
        }
        if (!r.ok || !data || !data.ok) {
          var errMsg = (data && data.error) || "Save failed for " + sectionKey;
          if (!isRetry && r.status === 403 && /csrf/i.test(errMsg)) {
            return refreshCsrfToken().then(function () {
              return saveSection(sectionKey, pageId, true, publish);
            });
          }
          if (/csrf/i.test(errMsg)) {
            throw new Error("Session token expired. Refresh the admin page, then Save again.");
          }
          throw new Error(errMsg);
        }
        return data;
      });
    });
  }

  function localDatetimeToIso(localValue) {
    var s = String(localValue || "").trim();
    if (!s) return null;
    var d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  function defaultScheduleLocalValue() {
    var d = new Date(Date.now() + 60 * 60 * 1000);
    d.setSeconds(0, 0);
    var pad = function (n) {
      return (n < 10 ? "0" : "") + n;
    };
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  function openPublishDialog() {
    return new Promise(function (resolve, reject) {
      var overlay = el("div", { class: "imgadj-overlay publish-overlay" });
      var modal = el("div", { class: "imgadj publish-modal" });
      modal.appendChild(el("h2", { text: "Publish changes" }));
      modal.appendChild(
        el("p", {
          class: "muted",
          text: "Publish now (default), or schedule a time for these changes to go live.",
        }),
      );

      var modeAsap = el("input", { type: "radio", name: "publish-mode", value: "asap", id: "publish-mode-asap" });
      modeAsap.checked = true;
      var modeSched = el("input", {
        type: "radio",
        name: "publish-mode",
        value: "schedule",
        id: "publish-mode-sched",
      });

      var asapLabel = el("label", { class: "publish-choice", for: "publish-mode-asap" });
      asapLabel.appendChild(modeAsap);
      asapLabel.appendChild(document.createTextNode(" Publish ASAP"));

      var schedLabel = el("label", { class: "publish-choice", for: "publish-mode-sched" });
      schedLabel.appendChild(modeSched);
      schedLabel.appendChild(document.createTextNode(" Publish at a specific date/time"));

      var whenWrap = el("div", { class: "field publish-when" });
      whenWrap.appendChild(el("label", { text: "Date & time (this computer’s clock)", for: "publish-at" }));
      var whenInput = el("input", {
        type: "datetime-local",
        id: "publish-at",
        value: defaultScheduleLocalValue(),
      });
      whenWrap.appendChild(whenInput);
      whenWrap.classList.add("is-disabled");

      function syncWhenEnabled() {
        var sched = modeSched.checked;
        whenInput.disabled = !sched;
        whenWrap.classList.toggle("is-disabled", !sched);
      }
      modeAsap.addEventListener("change", syncWhenEnabled);
      modeSched.addEventListener("change", syncWhenEnabled);
      syncWhenEnabled();

      var err = el("p", { class: "error publish-dialog-error", text: "" });
      err.hidden = true;

      function close(result) {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.removeEventListener("keydown", onKey);
        if (result) resolve(result);
        else reject(new Error("cancel"));
      }

      function onKey(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          close(null);
        }
      }

      var cancel = el("button", { type: "button", class: "btn-ghost", text: "Cancel" });
      cancel.addEventListener("click", function () {
        close(null);
      });
      var confirm = el("button", { type: "button", class: "btn btn-orange", text: "Continue" });
      confirm.addEventListener("click", function () {
        err.hidden = true;
        if (modeAsap.checked) {
          close({ mode: "asap" });
          return;
        }
        var iso = localDatetimeToIso(whenInput.value);
        if (!iso) {
          err.textContent = "Pick a valid date and time.";
          err.hidden = false;
          return;
        }
        if (new Date(iso).getTime() <= Date.now()) {
          err.textContent = "Scheduled time must be in the future, or choose Publish ASAP.";
          err.hidden = false;
          return;
        }
        close({ mode: "schedule", at: iso });
      });

      modal.appendChild(asapLabel);
      modal.appendChild(schedLabel);
      modal.appendChild(whenWrap);
      modal.appendChild(err);
      modal.appendChild(el("div", { class: "imgadj-actions" }, [cancel, confirm]));
      overlay.appendChild(modal);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close(null);
      });
      document.body.appendChild(overlay);
      document.addEventListener("keydown", onKey);
      confirm.focus();
    });
  }

  function formatPublishAt(iso) {
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso || "");
      return d.toLocaleString();
    } catch (e) {
      return String(iso || "");
    }
  }

  function refreshPublishBanner() {
    var host = document.getElementById("publish-banner-host");
    if (!host) return;
    host.innerHTML = "";
    var pending = Array.isArray(window.PUBLISH_PENDING) ? window.PUBLISH_PENDING : [];
    if (!pending.length) {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    pending.forEach(function (item) {
      if (!item || !item.id) return;
      var row = el("div", { class: "publish-banner" });
      var sections = item.sections && typeof item.sections === "object" ? Object.keys(item.sections) : [];
      var label =
        "Scheduled publish " +
        formatPublishAt(item.publishAt) +
        (sections.length ? " · " + sections.join(", ") : "");
      row.appendChild(el("span", { text: label }));
      var cancelBtn = el("button", { type: "button", class: "btn-outline", text: "Cancel schedule" });
      cancelBtn.addEventListener("click", function () {
        if (!confirm("Cancel this scheduled publish?")) return;
        cancelBtn.disabled = true;
        fetch("publish.php", {
          method: "POST",
          headers: { "content-type": "application/json", "X-CSRF-Token": window.CSRF_TOKEN || "" },
          credentials: "same-origin",
          body: JSON.stringify({
            action: "cancel",
            id: item.id,
            csrf: window.CSRF_TOKEN || "",
          }),
          cache: "no-store",
        })
          .then(function (r) {
            return r.json().then(function (data) {
              if (!r.ok || !data || !data.ok) {
                throw new Error((data && data.error) || "Could not cancel.");
              }
              return data;
            });
          })
          .then(function (data) {
            window.PUBLISH_PENDING = (window.PUBLISH_PENDING || []).filter(function (p) {
              return p && p.id !== item.id;
            });
            refreshPublishBanner();
          })
          .catch(function (err) {
            cancelBtn.disabled = false;
            alert((err && err.message) || "Could not cancel schedule.");
          });
      });
      row.appendChild(cancelBtn);
      host.appendChild(row);
    });
  }

  function fetchPublishPending() {
    return fetch("publish.php", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "X-CSRF-Token": window.CSRF_TOKEN || "" },
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data && data.ok && Array.isArray(data.pending)) {
          window.PUBLISH_PENDING = data.pending;
        }
        refreshPublishBanner();
      })
      .catch(function () {
        /* ignore */
      });
  }

  function makeUploadProgress() {
    var wrap = el("div", { class: "upload-progress hidden", "aria-live": "polite" });
    var track = el("div", { class: "upload-progress-track" });
    var bar = el("div", { class: "upload-progress-bar" });
    var label = el("p", { class: "upload-progress-label", text: "Uploading…" });
    track.appendChild(bar);
    wrap.appendChild(track);
    wrap.appendChild(label);

    function setProgress(pct, text) {
      wrap.classList.remove("hidden");
      if (pct === null || typeof pct !== "number" || isNaN(pct)) {
        bar.style.width = "35%";
        bar.classList.add("is-indeterminate");
        label.textContent = typeof text === "string" && text ? text : "Uploading…";
        return;
      }
      bar.classList.remove("is-indeterminate");
      var n = Math.max(0, Math.min(100, pct));
      bar.style.width = n + "%";
      if (typeof text === "string" && text) {
        label.textContent = text;
      } else {
        label.textContent = n >= 100 ? "Finishing…" : "Uploading… " + n + "%";
      }
    }

    function hide() {
      wrap.classList.add("hidden");
      bar.classList.remove("is-indeterminate");
      bar.style.width = "0%";
      label.textContent = "Uploading…";
    }

    return { el: wrap, setProgress: setProgress, hide: hide };
  }

  // Native file pickers often fire neither `change` nor (in older browsers) `cancel`
  // when dismissed. Escape-to-cancel can also close an admin sheet mid-dialog, leaving
  // an invisible full-viewport overlay that eats all clicks. Track picker state and
  // always clear locks / zombie sheets when the dialog closes.
  var fileDialogDepth = 0;

  function releaseAdminUiLocks() {
    document.querySelectorAll(".is-dragover").forEach(function (node) {
      node.classList.remove("is-dragover");
    });
    if (document.body.style.pointerEvents === "none") {
      document.body.style.pointerEvents = "";
    }
    if (document.documentElement.style.pointerEvents === "none") {
      document.documentElement.style.pointerEvents = "";
    }
    // Only remove sheets explicitly marked closing — a brand-new sheet is also
    // :not(.is-open) for one frame before rAF adds the class.
    document.querySelectorAll('.admin-sheet[data-closing="1"]').forEach(function (sheet) {
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
    });
    if (!document.querySelector(".admin-sheet.is-open")) {
      document.body.classList.remove("admin-sheet-lock");
    }
  }

  function isFileDialogOpen() {
    return fileDialogDepth > 0;
  }

  /**
   * Arm cleanup for a native file dialog. Call right before input.click() or on
   * the input's click (capture). Safe to call repeatedly; only one watch per open.
   */
  function armFileDialogWatch(input) {
    if (!input || input.type !== "file") return;
    if (input.getAttribute("data-file-watch") === "1") return;
    input.setAttribute("data-file-watch", "1");
    fileDialogDepth += 1;
    var settled = false;

    function settle() {
      if (settled) return;
      settled = true;
      input.removeAttribute("data-file-watch");
      fileDialogDepth = Math.max(0, fileDialogDepth - 1);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      input.removeEventListener("change", onChange);
      input.removeEventListener("cancel", onCancel);
      releaseAdminUiLocks();
    }

    function onChange() {
      // Defer so change handlers on the input can run first, then clear locks.
      setTimeout(settle, 0);
    }

    function onCancel() {
      settle();
    }

    function onFocus() {
      // Dialog closed (pick or cancel). `change` may fire after focus — wait briefly.
      setTimeout(function () {
        settle();
      }, 350);
    }

    function onVis() {
      if (document.visibilityState === "visible") onFocus();
    }

    input.addEventListener("change", onChange);
    input.addEventListener("cancel", onCancel);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
  }

  function triggerFilePicker(input) {
    if (!input) return;
    armFileDialogWatch(input);
    input.click();
  }

  // Catch direct clicks on visible <input type="file"> controls (CMS image/video/zip).
  document.addEventListener(
    "click",
    function (e) {
      var t = e.target;
      if (!t || !t.tagName) return;
      if (String(t.tagName).toLowerCase() === "input" && t.type === "file") {
        armFileDialogWatch(t);
      }
    },
    true,
  );

  // Native Save As / context-menu cancel also returns focus; sweep zombie sheets.
  var adminUiLockFocusTimer = null;
  function scheduleReleaseAdminUiLocks() {
    if (adminUiLockFocusTimer) clearTimeout(adminUiLockFocusTimer);
    adminUiLockFocusTimer = setTimeout(function () {
      adminUiLockFocusTimer = null;
      releaseAdminUiLocks();
    }, 350);
  }
  window.addEventListener("focus", scheduleReleaseAdminUiLocks);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") scheduleReleaseAdminUiLocks();
  });
  document.addEventListener("contextmenu", scheduleReleaseAdminUiLocks);

  function isImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.indexOf("image/") === 0) return true;
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name || "");
  }

  function isVideoFile(file) {
    if (!file) return false;
    if (file.type && file.type.indexOf("video/") === 0) return true;
    return /\.(mp4|webm|mov)$/i.test(file.name || "");
  }

  function isAudioFile(file) {
    if (!file) return false;
    if (file.type && file.type.indexOf("audio/") === 0) return true;
    return /\.(mp3|m4a|aac|ogg|oga|wav|weba|webm)$/i.test(file.name || "");
  }

  /**
   * Make an element accept drag-and-drop files (and optional clipboard paste).
   * opts: { kind: "image"|"video"|"audio", onFile: fn(File), disabled: fn():bool }
   */
  function bindMediaDropZone(target, opts) {
    opts = opts || {};
    var kind = opts.kind || "image";
    var onFile = opts.onFile;
    var isDisabled = typeof opts.disabled === "function" ? opts.disabled : function () {
      return false;
    };
    var depth = 0;

    function pickFile(fileList) {
      if (!fileList || !fileList.length) return null;
      for (var i = 0; i < fileList.length; i++) {
        var f = fileList[i];
        if (kind === "video") {
          if (isVideoFile(f)) return f;
        } else if (kind === "audio") {
          if (isAudioFile(f)) return f;
        } else if (isImageFile(f)) {
          return f;
        }
      }
      return null;
    }

    function acceptFile(file) {
      if (!file || isDisabled() || typeof onFile !== "function") return;
      onFile(file);
    }

    ["dragenter", "dragover"].forEach(function (type) {
      target.addEventListener(type, function (e) {
        if (isDisabled()) return;
        var types = e.dataTransfer && e.dataTransfer.types;
        var hasFiles = false;
        if (types) {
          if (typeof types.includes === "function") {
            hasFiles = types.includes("Files");
          } else if (typeof types.contains === "function") {
            hasFiles = types.contains("Files");
          } else {
            hasFiles = Array.prototype.indexOf.call(types, "Files") !== -1;
          }
        }
        if (!hasFiles) return;
        e.preventDefault();
        e.stopPropagation();
        if (type === "dragenter") depth += 1;
        target.classList.add("is-dragover");
        try {
          e.dataTransfer.dropEffect = "copy";
        } catch (err) {}
      });
    });

    target.addEventListener("dragleave", function (e) {
      e.preventDefault();
      e.stopPropagation();
      depth = Math.max(0, depth - 1);
      if (depth === 0) target.classList.remove("is-dragover");
    });

    target.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      depth = 0;
      target.classList.remove("is-dragover");
      if (isDisabled()) return;
      var file = pickFile(e.dataTransfer && e.dataTransfer.files);
      if (!file) {
        alert(
          kind === "video"
            ? "Please drop a video file (MP4, WEBM, or MOV)."
            : kind === "audio"
              ? "Please drop an audio file (MP3, M4A, OGG, or WAV)."
              : "Please drop an image file (PNG, JPG, WEBP, or GIF).",
        );
        return;
      }
      acceptFile(file);
    });

    if (opts.paste !== false) {
      target.setAttribute("tabindex", "0");
      target.addEventListener("paste", function (e) {
        if (isDisabled()) return;
        var items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          if (!item || item.kind !== "file") continue;
          var file = item.getAsFile();
          if (!file) continue;
          if (kind === "video") {
            if (!isVideoFile(file)) continue;
          } else if (kind === "audio") {
            if (!isAudioFile(file)) continue;
          } else if (!isImageFile(file)) {
            continue;
          }
          e.preventDefault();
          acceptFile(file);
          return;
        }
      });
    }
  }

  function loadImageElement(source) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(new Error("Could not load image."));
      };
      if (typeof source !== "string") {
        img.src = URL.createObjectURL(source);
        return;
      }
      // Only force CORS for true cross-origin URLs. Setting crossOrigin on
      // same-origin relative paths (../uploads/…) can break canvas export.
      var absolute =
        source.charAt(0) === "/" || /^(https?:)?\/\//i.test(source)
          ? source
          : new URL(source, location.href).href;
      if (/^(https?:)?\/\//i.test(absolute) && absolute.indexOf(location.origin) !== 0) {
        img.crossOrigin = "anonymous";
      }
      img.src = source;
    });
  }

  // Image adjuster: crop rectangle in real image-pixel space (what you see = what exports).
  function openImageAdjuster(source, options) {
    options = options || {};
    var initialAspect = options.cropAspect || "free";
    return loadImageElement(source).then(function (img) {
      return new Promise(function (resolve) {
        var objectUrl = typeof source !== "string" ? img.src : null;
        var nw = img.naturalWidth || img.width;
        var nh = img.naturalHeight || img.height;
        var aspect = initialAspect === "free" ? "free" : initialAspect;
        // Crop in source image pixels
        var crop = { x: 0, y: 0, w: nw, h: nh };
        var drag = null;
        var minPx = Math.max(24, Math.round(Math.min(nw, nh) * 0.05));

        var overlay = el("div", { class: "imgadj-overlay" });
        var modal = el("div", { class: "imgadj" });
        var stage = el("div", { class: "imgadj-stage is-free" });
        var preview = el("img", { alt: "", class: "imgadj-preview" });
        preview.src = img.src;
        preview.draggable = false;
        var frame = el("div", { class: "imgadj-frame is-free" });
        stage.appendChild(preview);
        stage.appendChild(frame);

        var handleDefs = [
          { id: "nw", edges: { n: 1, w: 1 } },
          { id: "n", edges: { n: 1 } },
          { id: "ne", edges: { n: 1, e: 1 } },
          { id: "e", edges: { e: 1 } },
          { id: "se", edges: { s: 1, e: 1 } },
          { id: "s", edges: { s: 1 } },
          { id: "sw", edges: { s: 1, w: 1 } },
          { id: "w", edges: { w: 1 } },
        ];
        handleDefs.forEach(function (def) {
          var h = el("div", {
            class: "imgadj-handle imgadj-handle-" + def.id,
            "data-handle": def.id,
          });
          h.addEventListener("pointerdown", function (e) {
            e.preventDefault();
            e.stopPropagation();
            beginDrag(e, "resize", {
              n: !!def.edges.n,
              s: !!def.edges.s,
              e: !!def.edges.e,
              w: !!def.edges.w,
            });
            try {
              h.setPointerCapture(e.pointerId);
            } catch (err) {}
          });
          frame.appendChild(h);
        });

        ["n", "s", "e", "w"].forEach(function (side) {
          var strip = el("div", {
            class: "imgadj-edge imgadj-edge-" + side,
            "data-edge": side,
          });
          strip.addEventListener("pointerdown", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var edges = { n: false, s: false, e: false, w: false };
            edges[side] = true;
            beginDrag(e, "resize", edges);
            try {
              strip.setPointerCapture(e.pointerId);
            } catch (err) {}
          });
          frame.appendChild(strip);
        });

        // Dedicated move tab — grab this to translate the crop box
        var moveTab = el("button", {
          type: "button",
          class: "imgadj-move-tab",
          title: "Drag to move crop",
          "aria-label": "Drag to move crop",
        });
        moveTab.innerHTML =
          '<span class="imgadj-move-tab-icon" aria-hidden="true">⠿</span>' +
          '<span class="imgadj-move-tab-label">Move</span>';
        moveTab.addEventListener("pointerdown", function (e) {
          e.preventDefault();
          e.stopPropagation();
          beginDrag(e, "move", null);
          try {
            moveTab.setPointerCapture(e.pointerId);
          } catch (err) {}
        });
        frame.appendChild(moveTab);

        var hint = el("p", {
          class: "imgadj-hint",
          text: "Hold the orange Move tab (top-left of the box) and drag to reposition. Use corners/edges to resize.",
        });

        var aspectRow = el("div", { class: "imgadj-aspect" }, [el("span", { text: "Shape" })]);
        var aspects = [
          { id: "free", label: "Free" },
          { id: "1:1", label: "1:1" },
          { id: "3:4", label: "3:4" },
          { id: "4:3", label: "4:3" },
          { id: "16:9", label: "16:9" },
          { id: "4:5", label: "4:5" },
        ];
        var aspectBtns = {};
        aspects.forEach(function (a) {
          var b = el("button", { type: "button", text: a.label });
          if (a.id === aspect) b.classList.add("on");
          b.addEventListener("click", function () {
            aspect = a.id;
            Object.keys(aspectBtns).forEach(function (k) {
              aspectBtns[k].classList.toggle("on", k === aspect);
            });
            applyAspectPreset();
            layout();
          });
          aspectBtns[a.id] = b;
          aspectRow.appendChild(b);
        });

        function aspectRatio() {
          var ratios = {
            "1:1": 1,
            "3:4": 3 / 4,
            "4:3": 4 / 3,
            "16:9": 16 / 9,
            "4:5": 4 / 5,
          };
          return aspect === "free" ? null : ratios[aspect] || 1;
        }

        function fitLayout() {
          var rect = stage.getBoundingClientRect();
          if (!rect.width || !rect.height || !nw || !nh) {
            return { fit: 1, ox: 0, oy: 0, dw: nw, dh: nh, sw: rect.width || 1, sh: rect.height || 1 };
          }
          var fit = Math.min(rect.width / nw, rect.height / nh);
          if (!isFinite(fit) || fit <= 0) fit = 1;
          var dw = nw * fit;
          var dh = nh * fit;
          return {
            fit: fit,
            ox: (rect.width - dw) / 2,
            oy: (rect.height - dh) / 2,
            dw: dw,
            dh: dh,
            sw: rect.width,
            sh: rect.height,
          };
        }

        function clampPos() {
          var maxX = Math.max(0, nw - crop.w);
          var maxY = Math.max(0, nh - crop.h);
          crop.x = Math.max(0, Math.min(maxX, crop.x));
          crop.y = Math.max(0, Math.min(maxY, crop.y));
        }

        function clampSize() {
          crop.w = Math.max(minPx, Math.min(nw, crop.w));
          crop.h = Math.max(minPx, Math.min(nh, crop.h));
          var r = aspectRatio();
          if (r) {
            if (crop.w / crop.h > r) crop.w = crop.h * r;
            else crop.h = crop.w / r;
            if (crop.w > nw) {
              crop.w = nw;
              crop.h = crop.w / r;
            }
            if (crop.h > nh) {
              crop.h = nh;
              crop.w = crop.h * r;
            }
            crop.w = Math.max(minPx, Math.min(nw, crop.w));
            crop.h = Math.max(minPx, Math.min(nh, crop.h));
          }
        }

        function clampCrop() {
          clampSize();
          clampPos();
        }

        function applyAspectPreset() {
          var r = aspectRatio();
          if (!r) {
            crop.w = nw * 0.7;
            crop.h = nh * 0.7;
            crop.x = (nw - crop.w) / 2;
            crop.y = (nh - crop.h) / 2;
            hint.textContent =
              "Hold the Move tab and drag to reposition. Use corners/edges to resize.";
          } else {
            var maxW;
            var maxH;
            if (nw / nh > r) {
              maxH = nh;
              maxW = nh * r;
            } else {
              maxW = nw;
              maxH = nw / r;
            }
            crop.w = maxW * 0.75;
            crop.h = maxH * 0.75;
            crop.x = (nw - crop.w) / 2;
            crop.y = (nh - crop.h) / 2;
            hint.textContent =
              "Hold the Move tab and drag to reposition. Use corners/edges to resize.";
          }
          clampCrop();
        }

        function layout() {
          var L = fitLayout();
          preview.style.width = L.dw + "px";
          preview.style.height = L.dh + "px";
          preview.style.left = L.ox + "px";
          preview.style.top = L.oy + "px";
          preview.style.transform = "none";

          frame.style.left = L.ox + crop.x * L.fit + "px";
          frame.style.top = L.oy + crop.y * L.fit + "px";
          frame.style.width = Math.max(1, crop.w * L.fit) + "px";
          frame.style.height = Math.max(1, crop.h * L.fit) + "px";
          frame.style.right = "auto";
          frame.style.bottom = "auto";
          // Do not set style.inset — it is shorthand and clears left/top.
        }

        function beginDrag(e, mode, edges) {
          endDrag();
          var L = fitLayout();
          drag = {
            mode: mode,
            edges: edges || { n: false, s: false, e: false, w: false },
            startClientX: e.clientX,
            startClientY: e.clientY,
            orig: { x: crop.x, y: crop.y, w: crop.w, h: crop.h },
            fit: L.fit,
            pointerId: e.pointerId,
          };
          stage.classList.add("is-dragging");
          document.addEventListener("pointermove", onDragMove);
          document.addEventListener("pointerup", endDrag);
          document.addEventListener("pointercancel", endDrag);
        }

        function onDragMove(e) {
          if (!drag) return;
          e.preventDefault();
          var fit = drag.fit || fitLayout().fit;
          if (!fit) fit = 1;
          var dx = (e.clientX - drag.startClientX) / fit;
          var dy = (e.clientY - drag.startClientY) / fit;
          var o = drag.orig;
          var r = aspectRatio();

          if (drag.mode === "move") {
            crop.x = o.x + dx;
            crop.y = o.y + dy;
            clampPos();
            layout();
            return;
          }

          var left = o.x;
          var top = o.y;
          var right = o.x + o.w;
          var bottom = o.y + o.h;
          var edges = drag.edges;

          if (!r) {
            if (edges.w) left = Math.min(right - minPx, Math.max(0, o.x + dx));
            if (edges.e) right = Math.max(left + minPx, Math.min(nw, o.x + o.w + dx));
            if (edges.n) top = Math.min(bottom - minPx, Math.max(0, o.y + dy));
            if (edges.s) bottom = Math.max(top + minPx, Math.min(nh, o.y + o.h + dy));
            crop.x = left;
            crop.y = top;
            crop.w = right - left;
            crop.h = bottom - top;
          } else {
            var anchorX = edges.w ? right : edges.e ? left : o.x + o.w / 2;
            var anchorY = edges.n ? bottom : edges.s ? top : o.y + o.h / 2;
            var pointerX = o.x + (edges.e ? o.w + dx : edges.w ? dx : o.w / 2);
            var pointerY = o.y + (edges.s ? o.h + dy : edges.n ? dy : o.h / 2);
            pointerX = Math.max(0, Math.min(nw, pointerX));
            pointerY = Math.max(0, Math.min(nh, pointerY));

            if ((edges.n || edges.s) && (edges.e || edges.w)) {
              var wCand = Math.max(minPx, Math.abs(pointerX - anchorX));
              var hCand = Math.max(minPx, Math.abs(pointerY - anchorY));
              if (Math.abs(dx) * r >= Math.abs(dy)) {
                crop.w = wCand;
                crop.h = crop.w / r;
              } else {
                crop.h = hCand;
                crop.w = crop.h * r;
              }
            } else if (edges.e || edges.w) {
              crop.w = Math.max(minPx, Math.abs(pointerX - anchorX));
              crop.h = crop.w / r;
            } else {
              crop.h = Math.max(minPx, Math.abs(pointerY - anchorY));
              crop.w = crop.h * r;
            }

            if (crop.w > nw) {
              crop.w = nw;
              crop.h = crop.w / r;
            }
            if (crop.h > nh) {
              crop.h = nh;
              crop.w = crop.h * r;
            }

            if (edges.w) crop.x = anchorX - crop.w;
            else if (edges.e) crop.x = anchorX;
            else crop.x = anchorX - crop.w / 2;

            if (edges.n) crop.y = anchorY - crop.h;
            else if (edges.s) crop.y = anchorY;
            else crop.y = anchorY - crop.h / 2;
          }
          clampCrop();
          layout();
        }

        function endDrag() {
          if (!drag) return;
          drag = null;
          stage.classList.remove("is-dragging");
          document.removeEventListener("pointermove", onDragMove);
          document.removeEventListener("pointerup", endDrag);
          document.removeEventListener("pointercancel", endDrag);
        }

        function close(result) {
          endDrag();
          window.removeEventListener("resize", onResize);
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          document.removeEventListener("keydown", onKey);
          releaseAdminUiLocks();
          resolve(result);
        }

        var uploading = false;
        var progress = makeUploadProgress();

        function setBusy(busy) {
          uploading = busy;
          apply.disabled = busy;
          cancel.disabled = busy;
          reset.disabled = busy;
          skip.disabled = busy;
          aspectRow.querySelectorAll("button").forEach(function (b) {
            b.disabled = busy;
          });
        }

        function uploadThenClose(fileObj) {
          if (!fileObj || uploading) return;
          setBusy(true);
          progress.setProgress(0);
          uploadFile(fileObj, function (pct) {
            progress.setProgress(pct);
          })
            .then(function (url) {
              if (url) {
                close(url);
                return;
              }
              progress.hide();
              setBusy(false);
            })
            .catch(function (err) {
              progress.hide();
              setBusy(false);
              alert((err && err.message) || "Upload failed.");
            });
        }

        function onKey(e) {
          if (e.key === "Escape") {
            if (uploading) return;
            if (isFileDialogOpen()) return;
            close(null);
          }
        }
        document.addEventListener("keydown", onKey);

        function onResize() {
          layout();
        }
        window.addEventListener("resize", onResize);

        function exportFile() {
          if (uploading) return;
          clampCrop();
          var sx = Math.round(crop.x);
          var sy = Math.round(crop.y);
          var sw = Math.max(1, Math.round(crop.w));
          var sh = Math.max(1, Math.round(crop.h));
          if (sx + sw > nw) sw = nw - sx;
          if (sy + sh > nh) sh = nh - sy;

          var maxEdge = Math.max(512, Math.min(4096, parseInt(options.maxEdge, 10) || 2400));
          var scale = Math.min(1, maxEdge / Math.max(sw, sh));
          var outW = Math.max(1, Math.round(sw * scale));
          var outH = Math.max(1, Math.round(sh * scale));

          var canvas = document.createElement("canvas");
          canvas.width = outW;
          canvas.height = outH;
          var ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

          apply.disabled = true;
          cancel.disabled = true;
          skip.disabled = true;
          reset.disabled = true;
          progress.setProgress(null);
          progress.el.querySelector(".upload-progress-label").textContent = "Preparing image…";

          canvas.toBlob(
            function (blob) {
              if (!blob) {
                alert("Could not export image.");
                progress.hide();
                setBusy(false);
                return;
              }
              uploadThenClose(new File([blob], "adjusted-" + Date.now() + ".png", { type: "image/png" }));
            },
            "image/png",
          );
        }

        var cancel = el("button", { type: "button", class: "btn-ghost", text: "Cancel" });
        cancel.addEventListener("click", function () {
          if (uploading) return;
          close(null);
        });
        var apply = el("button", { type: "button", class: "btn btn-orange", text: "Apply & upload" });
        apply.addEventListener("click", exportFile);

        var skip = el("button", { type: "button", class: "btn-ghost", text: "Upload original" });
        skip.style.marginRight = "auto";
        skip.addEventListener("click", function () {
          if (uploading) return;
          if (typeof source !== "string") uploadThenClose(source);
          else close(null);
        });
        if (typeof source === "string") skip.style.display = "none";

        var reset = el("button", { type: "button", class: "btn-outline", text: "Reset" });
        reset.addEventListener("click", function () {
          if (uploading) return;
          applyAspectPreset();
          layout();
        });

        var actions = el("div", { class: "imgadj-actions" }, [skip, reset, cancel, apply]);
        var controls = el("div", { class: "imgadj-controls" }, [aspectRow]);

        modal.appendChild(el("h2", { text: "Crop image" }));
        modal.appendChild(hint);
        modal.appendChild(stage);
        modal.appendChild(controls);
        modal.appendChild(progress.el);
        modal.appendChild(actions);
        overlay.appendChild(modal);
        overlay.addEventListener("click", function (e) {
          if (e.target === overlay && !drag && !uploading) close(null);
        });
        document.body.appendChild(overlay);
        applyAspectPreset();
        requestAnimationFrame(function () {
          layout();
          requestAnimationFrame(layout);
        });
      });
    });
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function formatTime12(hhmm) {
    if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return "";
    var parts = hhmm.split(":");
    var h = parseInt(parts[0], 10);
    var m = parts[1];
    if (isNaN(h)) return "";
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ":" + m + " " + ampm;
  }

  function formatEventDisplay(mode, dateStart, timeStart, timeEnd) {
    mode = mode || "scheduled";
    if (mode === "upcoming") return "Coming up";
    if (mode === "past") return "Past event";
    if (!dateStart) return "";
    var d = new Date(dateStart + "T12:00:00");
    if (isNaN(d.getTime())) return "";
    var label = d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    var t1 = formatTime12(timeStart);
    var t2 = formatTime12(timeEnd);
    if (t1 && t2) return label + " · " + t1 + "–" + t2;
    if (t1) return label + " · " + t1;
    return label;
  }

  function inferEventWhen(record, labelKey) {
    var label = String((record && record[labelKey]) || "").trim();
    var lower = label.toLowerCase();
    if (record.dateMode) return;
    if (record.dateStart) {
      record.dateMode = "scheduled";
      return;
    }
    if (!label) {
      record.dateMode = "scheduled";
      return;
    }
    if (lower === "coming up" || lower === "upcoming") {
      record.dateMode = "upcoming";
      return;
    }
    if (lower === "past event" || lower === "past") {
      record.dateMode = "past";
      return;
    }
    // Legacy free-text date — keep as custom so nothing is lost.
    record.dateMode = "custom";
  }

  function eventWhenKeys(field) {
    // events use date/dateMode/dateStart… ; royale uses eventDate/eventDateMode…
    if (field.key === "date") {
      return {
        label: "date",
        mode: "dateMode",
        start: "dateStart",
        timeStart: "timeStart",
        timeEnd: "timeEnd",
      };
    }
    return {
      label: field.key,
      mode: field.key + "Mode",
      start: field.key + "Start",
      timeStart: field.key + "TimeStart",
      timeEnd: field.key + "TimeEnd",
    };
  }

  function eventWhenControl(record, field) {
    var keys = eventWhenKeys(field);
    var allowPresets = field.presets !== false;
    inferEventWhen(record, keys.label);

    var box = el("div", { class: "whenctl" });
    var preview = el("p", { class: "whenctl-preview muted" });

    function syncLabel() {
      var mode = record[keys.mode] || "scheduled";
      if (mode === "custom") {
        // Leave record[keys.label] as whatever the admin typed.
        preview.textContent = record[keys.label]
          ? "Shows as: " + record[keys.label]
          : "No date text yet";
        return;
      }
      var label = formatEventDisplay(
        mode,
        record[keys.start] || "",
        record[keys.timeStart] || "",
        record[keys.timeEnd] || "",
      );
      record[keys.label] = label;
      preview.textContent = label ? "Shows as: " + label : "Pick a date to preview the label";
    }

    function setMode(mode) {
      record[keys.mode] = mode;
      if (mode === "upcoming" || mode === "past") {
        // Keep any previously chosen calendar values, but label becomes preset.
      }
      if (mode !== "custom") {
        // Leaving custom → rebuild from structured fields.
      }
      paint();
      syncLabel();
    }

    var modeRow = el("div", { class: "whenctl-modes" });
    var modes = [{ id: "scheduled", label: "Calendar" }];
    if (allowPresets) {
      modes.push({ id: "upcoming", label: "Upcoming" });
      modes.push({ id: "past", label: "Past" });
    }
    modes.push({ id: "custom", label: "Custom text" });

    var modeBtns = {};
    modes.forEach(function (m) {
      var btn = el("button", { type: "button", class: "whenctl-mode", text: m.label });
      btn.addEventListener("click", function () {
        setMode(m.id);
      });
      modeBtns[m.id] = btn;
      modeRow.appendChild(btn);
    });

    var scheduled = el("div", { class: "whenctl-scheduled" });
    var dateField = el("div", { class: "whenctl-row" });
    dateField.appendChild(el("label", { text: "Date" }));
    var dateInput = el("input", { type: "date" });
    dateInput.value = record[keys.start] || "";
    dateInput.addEventListener("change", function () {
      record[keys.start] = dateInput.value;
      if ((record[keys.mode] || "") === "custom") record[keys.mode] = "scheduled";
      syncLabel();
      paint();
    });
    dateField.appendChild(dateInput);
    scheduled.appendChild(dateField);

    var timeBlock = el("div", { class: "whenctl-times" });
    var startToggle = el("label", { class: "whenctl-check" });
    var startCheck = el("input", { type: "checkbox" });
    startCheck.checked = !!(record[keys.timeStart] || "").trim();
    startToggle.appendChild(startCheck);
    startToggle.appendChild(document.createTextNode(" Include start time"));
    var startTime = el("input", { type: "time" });
    startTime.value = record[keys.timeStart] || "";
    startTime.disabled = !startCheck.checked;

    var endToggle = el("label", { class: "whenctl-check" });
    var endCheck = el("input", { type: "checkbox" });
    endCheck.checked = !!(record[keys.timeEnd] || "").trim();
    endToggle.appendChild(endCheck);
    endToggle.appendChild(document.createTextNode(" Include end time"));
    var endTime = el("input", { type: "time" });
    endTime.value = record[keys.timeEnd] || "";
    endTime.disabled = !endCheck.checked || !startCheck.checked;

    function onStartToggle() {
      if (startCheck.checked) {
        startTime.disabled = false;
        if (!startTime.value) startTime.value = "18:00";
        record[keys.timeStart] = startTime.value;
        endToggle.style.opacity = "1";
        endCheck.disabled = false;
      } else {
        startTime.disabled = true;
        startTime.value = "";
        record[keys.timeStart] = "";
        endCheck.checked = false;
        endCheck.disabled = true;
        endTime.disabled = true;
        endTime.value = "";
        record[keys.timeEnd] = "";
        endToggle.style.opacity = "0.55";
      }
      syncLabel();
    }

    function onEndToggle() {
      if (!startCheck.checked) {
        endCheck.checked = false;
        return;
      }
      if (endCheck.checked) {
        endTime.disabled = false;
        if (!endTime.value) {
          // Default one hour after start when possible.
          var parts = (startTime.value || "18:00").split(":");
          var h = (parseInt(parts[0], 10) + 1) % 24;
          endTime.value = pad2(h) + ":" + (parts[1] || "00");
        }
        record[keys.timeEnd] = endTime.value;
      } else {
        endTime.disabled = true;
        endTime.value = "";
        record[keys.timeEnd] = "";
      }
      syncLabel();
    }

    startCheck.addEventListener("change", onStartToggle);
    endCheck.addEventListener("change", onEndToggle);
    startTime.addEventListener("change", function () {
      record[keys.timeStart] = startTime.value;
      syncLabel();
    });
    endTime.addEventListener("change", function () {
      record[keys.timeEnd] = endTime.value;
      syncLabel();
    });

    timeBlock.appendChild(startToggle);
    timeBlock.appendChild(startTime);
    timeBlock.appendChild(endToggle);
    timeBlock.appendChild(endTime);
    scheduled.appendChild(timeBlock);

    var custom = el("div", { class: "whenctl-custom" });
    custom.appendChild(
      el("p", {
        class: "muted whenctl-hint",
        text: "Free-form label (for odd cases like “every other Tuesday”). Prefer Calendar when you can.",
      }),
    );
    var customInput = el("input", {
      type: "text",
      placeholder: "e.g. Coming up · every other Tue/Thu",
    });
    customInput.value = record[keys.label] || "";
    customInput.addEventListener("input", function () {
      record[keys.label] = customInput.value;
      record[keys.mode] = "custom";
      syncLabel();
      paint();
    });
    custom.appendChild(customInput);

    var presetNote = el("p", { class: "muted whenctl-hint whenctl-preset-note" });

    function paint() {
      var mode = record[keys.mode] || "scheduled";
      Object.keys(modeBtns).forEach(function (id) {
        modeBtns[id].classList.toggle("on", id === mode);
      });
      scheduled.style.display = mode === "scheduled" ? "" : "none";
      custom.style.display = mode === "custom" ? "" : "none";
      if (mode === "upcoming") {
        presetNote.style.display = "";
        presetNote.textContent = "Shows as “Coming up” on the site.";
      } else if (mode === "past") {
        presetNote.style.display = "";
        presetNote.textContent = "Shows as “Past event” on the site.";
      } else {
        presetNote.style.display = "none";
      }
      // Keep checkbox UI in sync if values changed externally.
      startCheck.checked = !!(record[keys.timeStart] || "").trim();
      startTime.disabled = !startCheck.checked;
      endCheck.checked = !!(record[keys.timeEnd] || "").trim();
      endCheck.disabled = !startCheck.checked;
      endTime.disabled = !endCheck.checked || !startCheck.checked;
      endToggle.style.opacity = startCheck.checked ? "1" : "0.55";
      dateInput.value = record[keys.start] || "";
      startTime.value = record[keys.timeStart] || "";
      endTime.value = record[keys.timeEnd] || "";
      if (mode === "custom") customInput.value = record[keys.label] || "";
    }

    box.appendChild(modeRow);
    box.appendChild(presetNote);
    box.appendChild(scheduled);
    box.appendChild(custom);
    box.appendChild(preview);
    paint();
    syncLabel();
    return box;
  }

  function phoneDigits(value) {
    return String(value == null ? "" : value).replace(/\D/g, "");
  }

  /** US display format: (334) 559-0853. Progressive while typing. */
  function formatUsPhoneDisplay(value) {
    var d = phoneDigits(value);
    if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
    if (!d) return "";
    if (d.length < 4) return "(" + d;
    if (d.length < 7) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6, 10);
  }

  function looksLikeUsPhone(value) {
    var d = phoneDigits(value);
    if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
    return d.length === 10;
  }

  function phoneControl(record, field) {
    var formatKey = field.formatKey || "phoneCustomFormat";
    if (record[formatKey] !== "yes" && record[formatKey] !== "no") {
      record[formatKey] = "no";
    }
    // Normalize existing value once when opening in auto mode.
    if (record[formatKey] !== "yes" && record[field.key]) {
      var normalized = formatUsPhoneDisplay(record[field.key]);
      if (normalized) record[field.key] = normalized;
    }

    var box = el("div", { class: "phonectl" });
    var input = el("input", {
      type: "tel",
      inputmode: "tel",
      autocomplete: "tel",
      placeholder: field.placeholder || "(334) 555-1234",
    });
    input.value = record[field.key] || "";

    var toggleRow = el("label", { class: "phonectl-toggle" });
    var toggle = el("input", { type: "checkbox" });
    toggle.checked = record[formatKey] === "yes";
    toggleRow.appendChild(toggle);
    toggleRow.appendChild(
      document.createTextNode(" Use custom format (type exactly how it should appear)"),
    );

    var hint = el("p", {
      class: "muted phonectl-hint",
      text:
        field.hint ||
        "Auto-formats US numbers as (334) 555-1234. Custom format keeps whatever you type.",
    });
    var status = el("p", { class: "phonectl-status muted" });

    function paintStatus() {
      var custom = record[formatKey] === "yes";
      input.classList.toggle("is-custom", custom);
      if (!record[field.key]) {
        status.textContent = "";
        status.className = "phonectl-status muted";
        return;
      }
      if (custom) {
        status.textContent = "Showing exactly as typed.";
        status.className = "phonectl-status muted";
        return;
      }
      if (looksLikeUsPhone(record[field.key])) {
        status.textContent = "Looks good — " + formatUsPhoneDisplay(record[field.key]);
        status.className = "phonectl-status is-ok";
      } else {
        status.textContent = "Enter a 10-digit US number, or enable custom format.";
        status.className = "phonectl-status is-warn";
      }
    }

    function applyFromInput() {
      var custom = record[formatKey] === "yes";
      var raw = input.value;
      if (custom) {
        record[field.key] = raw.trim();
      } else {
        var formatted = formatUsPhoneDisplay(raw);
        record[field.key] = formatted;
        if (input.value !== formatted) input.value = formatted;
      }
      paintStatus();
    }

    input.addEventListener("input", function () {
      if (record[formatKey] === "yes") {
        record[field.key] = input.value;
        paintStatus();
        return;
      }
      // Keep caret near end while formatting; good enough for phone entry.
      var formatted = formatUsPhoneDisplay(input.value);
      record[field.key] = formatted;
      input.value = formatted;
      paintStatus();
    });
    input.addEventListener("blur", applyFromInput);

    toggle.addEventListener("change", function () {
      record[formatKey] = toggle.checked ? "yes" : "no";
      if (!toggle.checked) {
        var formatted = formatUsPhoneDisplay(input.value);
        record[field.key] = formatted;
        input.value = formatted;
      }
      paintStatus();
    });

    box.appendChild(input);
    box.appendChild(toggleRow);
    box.appendChild(hint);
    box.appendChild(status);
    paintStatus();
    return box;
  }

  function fieldEditor(record, field) {
    var wrap = el("div", { class: "field" }, [el("label", { text: field.label })]);
    var input;
    if (field.type === "eventWhen") {
      wrap.appendChild(eventWhenControl(record, field));
      return wrap;
    } else if (field.type === "switch") {
      wrap.className = "field field-switch";
      var onVal = field.on != null ? field.on : "yes";
      var offVal = field.off != null ? field.off : "no";
      if (
        (record[field.key] == null || String(record[field.key]).trim() === "") &&
        field.default != null
      ) {
        record[field.key] = field.default;
      }
      function switchIsOn(val) {
        if (val === onVal || val === true || val === 1) return true;
        if (typeof val === "string") {
          var s = val.trim().toLowerCase();
          if (s === String(onVal).toLowerCase()) return true;
          if (s === "yes" || s === "true" || s === "1" || s === "on") return true;
        }
        return false;
      }
      // Normalize legacy/boolean values to the stored on/off strings.
      record[field.key] = switchIsOn(record[field.key]) ? onVal : offVal;
      var row = el("div", { class: "switch-row" });
      var btn = el("button", {
        type: "button",
        class: "admin-switch",
        role: "switch",
        "aria-checked": record[field.key] === onVal ? "true" : "false",
        "aria-label": field.label,
      });
      btn.appendChild(el("span", { class: "admin-switch-knob" }));
      var state = el("span", { class: "admin-switch-state" });
      function paint() {
        var on = record[field.key] === onVal;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-checked", on ? "true" : "false");
        state.textContent = on ? "On" : "Off";
        state.classList.toggle("is-on", on);
      }
      btn.addEventListener("click", function () {
        record[field.key] = record[field.key] === onVal ? offVal : onVal;
        paint();
      });
      row.appendChild(btn);
      row.appendChild(state);
      wrap.appendChild(row);
      if (field.hint) {
        wrap.appendChild(el("p", { class: "field-hint", text: field.hint }));
      }
      paint();
      return wrap;
    } else if (field.type === "textarea") {
      var rows = String(field.rows || 3);
      input = el("textarea", { rows: rows });
      if (field.maxLines) {
        var maxLinesInit = String(record[field.key] || "")
          .replace(/\r\n/g, "\n")
          .split("\n")
          .slice(0, field.maxLines)
          .join("\n");
        input.value = maxLinesInit;
        record[field.key] = maxLinesInit;
        function applyMaxLines() {
          var max = field.maxLines;
          var val = String(input.value || "").replace(/\r\n/g, "\n");
          var lines = val.split("\n");
          if (lines.length > max) {
            var start = input.selectionStart;
            val = lines.slice(0, max).join("\n");
            input.value = val;
            if (typeof start === "number") {
              var cap = val.length;
              input.setSelectionRange(Math.min(start, cap), Math.min(start, cap));
            }
          }
          record[field.key] = val;
        }
        input.addEventListener("keydown", function (e) {
          if (e.key !== "Enter" || e.ctrlKey || e.metaKey || e.altKey) return;
          var cur = String(input.value || "").replace(/\r\n/g, "\n");
          if (cur.split("\n").length >= field.maxLines) {
            e.preventDefault();
          }
        });
        input.addEventListener("paste", function () {
          setTimeout(applyMaxLines, 0);
        });
        input.addEventListener("input", applyMaxLines);
      } else {
        input.value = record[field.key] || "";
        input.addEventListener("input", function () {
          record[field.key] = input.value;
        });
      }
    } else if (field.type === "select") {
      input = el("select");
      if (!record[field.key] && field.options && field.options.length) {
        record[field.key] = selectOptionValue(field.options[0]);
      }
      (field.options || []).forEach(function (opt) {
        var o = el("option", {
          value: selectOptionValue(opt),
          text: selectOptionLabel(opt),
        });
        if (String(record[field.key]) === selectOptionValue(opt)) o.selected = true;
        input.appendChild(o);
      });
      input.addEventListener("change", function () {
        record[field.key] = input.value;
      });
    } else if (field.type === "phone") {
      wrap.appendChild(phoneControl(record, field));
      return wrap;
    } else if (field.type === "socialIcon") {
      wrap.appendChild(socialIconControl(record, field));
      return wrap;
    } else if (field.type === "image") {
      wrap.appendChild(
        imageControl(
          function () {
            return record[field.key] || "";
          },
          function (v) {
            record[field.key] = v;
          },
          {
            cropAspect: field.cropAspect || "free",
            skipAdjust: !!field.skipAdjust,
            maxEdge: field.maxEdge || 2400,
            fieldKey: field.key || "",
            onUploaded: field.onUploaded || null,
          },
        ),
      );
      return wrap;
    } else if (field.type === "video") {
      wrap.appendChild(
        videoControl(
          function () {
            return record[field.key] || "";
          },
          function (v) {
            record[field.key] = v;
          },
        ),
      );
      if (field.hint) {
        wrap.appendChild(el("p", { class: "field-hint", text: field.hint }));
      }
      return wrap;
    } else if (field.type === "audio") {
      wrap.appendChild(
        audioControl(
          function () {
            return record[field.key] || "";
          },
          function (v) {
            record[field.key] = v;
          },
        ),
      );
      return wrap;
    } else if (field.type === "imageList") {
      if (!Array.isArray(record[field.key])) record[field.key] = [];
      record[field.key] = record[field.key]
        .map(function (item) {
          if (typeof item === "string") return { image: item };
          if (!item || typeof item !== "object") return { image: "" };
          return { image: item.image || "" };
        })
        .filter(function (item, idx, arr) {
          // keep empties so user can fill; only drop totally invalid
          return item != null;
        });
      wrap.appendChild(
        listEditor(
          record[field.key],
          [{ key: "image", label: "Photo", type: "image" }],
          field.itemLabel || "Photo",
        ),
      );
      return wrap;
    } else if (field.type === "list") {
      if (!Array.isArray(record[field.key])) record[field.key] = [];
      wrap.appendChild(
        listEditor(record[field.key], field.item || [], field.itemLabel || "Item"),
      );
      return wrap;
    } else {
      input = el("input", { type: "text" });
      if (
        (record[field.key] == null || String(record[field.key]).trim() === "") &&
        field.default != null
      ) {
        record[field.key] = field.default;
      }
      input.value = record[field.key] || "";
      input.addEventListener("input", function () {
        record[field.key] = input.value;
      });
      if (field.softCurrencyPrefix) {
        var currencyPrefix = String(field.softCurrencyPrefix);
        input.addEventListener("blur", function () {
          var raw = String(input.value || "").trim();
          var next = raw;
          // Keep empty blank (do not force bare "$"); only prefix plain numbers.
          if (raw && /^\d+(\.\d+)?$/.test(raw)) {
            next = currencyPrefix + raw;
          }
          if (input.value !== next) input.value = next;
          record[field.key] = next;
        });
      }
    }
    wrap.appendChild(input);
    if (field.hint || field.moreInfo) {
      if (field.hint) {
        wrap.appendChild(el("p", { class: "field-hint", text: field.hint }));
      }
      if (field.moreInfo) {
        var moreBtn = el("button", {
          type: "button",
          class: "field-more-btn",
          text: "View more",
        });
        moreBtn.addEventListener("click", function () {
          openFieldMoreInfo(field);
        });
        wrap.appendChild(moreBtn);
      }
    }
    return wrap;
  }

  function openFieldMoreInfo(field) {
    var key = field.moreInfo;
    if (key === "holidayTheme") {
      openAdminInfoSheet("Holiday theme — schedule & details", holidayThemeInfoBody());
      return;
    }
    openAdminInfoSheet(field.label || "Details", [
      el("p", { text: field.hint || "No extra details for this setting." }),
    ]);
  }

  function holidayThemeInfoBody() {
    var wrap = el("div", { class: "admin-info-body" });
    wrap.appendChild(
      el("p", {
        text: "When set to auto, the public site picks a theme from the visitor’s local date. Force a theme anytime, or choose off if something looks wrong.",
      }),
    );
    wrap.appendChild(el("h3", { text: "Auto schedule" }));
    var table = el("table", { class: "admin-info-table" });
    var thead = el("thead");
    var headRow = el("tr");
    ["Theme", "Dates (auto)", "Look"].forEach(function (h) {
      headRow.appendChild(el("th", { text: h }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = el("tbody");
    [
      ["valentines", "Feb 7 – Feb 15", "Pink bar + 💌"],
      ["newyear", "Jan 20 – Feb 28*", "Chinese New Year red + 🧧 year + zodiac animal"],
      ["stpatricks", "Mar 10 – Mar 18", "Green bar + ☘️"],
      ["july4", "Jun 28 – Jul 6", "Red/blue bar + US flag"],
      ["halloween", "Oct 15 – Nov 2", "Orange/purple bar + 🎃"],
      ["christmas", "Dec 1 – Dec 27", "Festive orange→red bar + 🎄"],
    ].forEach(function (row) {
      var tr = el("tr");
      row.forEach(function (cell) {
        tr.appendChild(el("td", { text: cell }));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    wrap.appendChild(
      el("p", {
        class: "admin-info-note",
        text: "* Valentine (Feb 7–15) wins over Chinese New Year if both windows overlap.",
      }),
    );
    wrap.appendChild(el("h3", { text: "Options" }));
    var ul = el("ul", { class: "admin-info-list" });
    [
      "auto — use the schedule above (default).",
      "off — never show a holiday theme.",
      "Named themes (halloween, christmas, …) — force that look until you change it.",
      "newyear uses a Chinese New Year style; the 🧧 year and animal follow the lunar new year (not Jan 1).",
      "Does not change light/dark mode. Easy to remove later (search HOLIDAY_THEMES in the code).",
    ].forEach(function (line) {
      ul.appendChild(el("li", { text: line }));
    });
    wrap.appendChild(ul);
    return wrap;
  }

  function openAdminInfoSheet(title, bodyContent) {
    var overlay = el("div", { class: "admin-sheet", "aria-hidden": "false" });
    var backdrop = el("div", { class: "admin-sheet-backdrop" });
    var panel = el("div", {
      class: "admin-sheet-panel",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": title || "Details",
    });
    var head = el("header", { class: "admin-sheet-head" });
    head.appendChild(el("h2", { text: title || "Details" }));
    var closeBtn = el("button", {
      type: "button",
      class: "admin-sheet-close",
      "aria-label": "Close",
      text: "×",
    });
    head.appendChild(closeBtn);
    panel.appendChild(head);

    var body = el("div", { class: "admin-sheet-body" });
    if (typeof bodyContent === "string") {
      body.appendChild(el("p", { text: bodyContent }));
    } else if (bodyContent && bodyContent.nodeType) {
      body.appendChild(bodyContent);
    } else if (Array.isArray(bodyContent)) {
      bodyContent.forEach(function (node) {
        if (node) body.appendChild(node);
      });
    }
    panel.appendChild(body);

    var actions = el("div", { class: "admin-sheet-actions" });
    var close = el("button", { type: "button", class: "btn btn-orange", text: "Close" });
    actions.appendChild(close);
    panel.appendChild(actions);

    overlay.appendChild(backdrop);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.body.classList.add("admin-sheet-lock");
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });

    var closed = false;
    function finish() {
      if (closed) return;
      closed = true;
      overlay.style.pointerEvents = "none";
      overlay.setAttribute("aria-hidden", "true");
      overlay.setAttribute("data-closing", "1");
      overlay.classList.remove("is-open");
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.removeEventListener("keydown", onKey);
        if (!document.querySelector(".admin-sheet.is-open")) {
          document.body.classList.remove("admin-sheet-lock");
        }
      }, 220);
    }
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      }
    }
    closeBtn.addEventListener("click", finish);
    close.addEventListener("click", finish);
    backdrop.addEventListener("click", finish);
    document.addEventListener("keydown", onKey);
    setTimeout(function () {
      try {
        close.focus();
      } catch (err) {}
    }, 30);
  }

  function downloadBlob(filename, blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);
  }

  function builtInSocialSvgMarkup(iconKey) {
    return socialIconSvg(iconKey || "");
  }

  function builtInSocialSvgDocument(iconKey) {
    var inner = builtInSocialSvgMarkup(iconKey);
    if (!inner) return "";
    // Standalone downloadable SVG (navy fill for editing outside the admin).
    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      inner
        .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
        .replace('fill="currentColor"', 'fill="#344E74"') +
      "\n"
    );
  }

  /** Rasterize SVG uploads to PNG before send (server does not accept raw SVG). */
  function rasterizeImageFileForIcon(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject(new Error("No file"));
        return;
      }
      var isSvg =
        (file.type && file.type.toLowerCase() === "image/svg+xml") ||
        /\.svg$/i.test(file.name || "");
      if (!isSvg) {
        resolve(file);
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () {
        reject(new Error("Could not read SVG."));
      };
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var size = 256;
          var canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          var ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas unavailable."));
            return;
          }
          var iw = img.naturalWidth || size;
          var ih = img.naturalHeight || size;
          var scale = Math.min(size / iw, size / ih);
          var dw = Math.max(1, Math.round(iw * scale));
          var dh = Math.max(1, Math.round(ih * scale));
          var dx = Math.round((size - dw) / 2);
          var dy = Math.round((size - dh) / 2);
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, dx, dy, dw, dh);
          if (canvas.toBlob) {
            canvas.toBlob(
              function (blob) {
                if (!blob) {
                  reject(new Error("Could not convert SVG."));
                  return;
                }
                resolve(new File([blob], "social-icon.png", { type: "image/png" }));
              },
              "image/png",
            );
          } else {
            reject(new Error("Could not convert SVG."));
          }
        };
        img.onerror = function () {
          reject(new Error("Could not load SVG. Try PNG or SVG without external links."));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function socialIconControl(record, field) {
    var key = field.key || "image";
    if (record[key] == null) record[key] = "";
    var box = el("div", {
      class: "social-icon-ctl",
      "aria-label": "Custom social icon. Upload, download, or reset.",
    });
    var preview = el("div", { class: "social-icon-ctl__preview", "aria-hidden": "true" });
    var status = el("p", { class: "social-icon-ctl__status" });
    var file = el("input", {
      type: "file",
      accept: "image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif",
    });
    var uploadBtn = el("button", { type: "button", class: "btn-outline", text: "Upload & convert" });
    var downloadBtn = el("button", { type: "button", class: "btn-outline", text: "Download" });
    var clearBtn = el("button", { type: "button", class: "link-danger", text: "Use built-in" });
    var actions = el("div", { class: "social-icon-ctl__actions" }, [uploadBtn, downloadBtn, clearBtn]);
    var progress = makeUploadProgress();
    var busy = false;
    var hint = el("p", {
      class: "field-hint",
      text:
        field.hint ||
        "Uploads become a navy (#344E74) silhouette so they match the built-in icons. The public footer shows them in white like the SVGs.",
    });

    function customSrc() {
      return record[key] && String(record[key]).trim() ? String(record[key]).trim() : "";
    }

    function refresh() {
      var custom = customSrc();
      preview.innerHTML = "";
      if (custom) {
        preview.appendChild(
          el("img", { src: previewSrc(custom), alt: "", draggable: "false" }),
        );
        status.textContent = "Custom navy icon (synced sitewide when you save).";
        clearBtn.style.display = "";
      } else {
        var svg = builtInSocialSvgMarkup(record.icon);
        if (svg) {
          preview.innerHTML = svg;
        } else {
          preview.textContent = "—";
        }
        status.textContent = "Using built-in icon.";
        clearBtn.style.display = "none";
      }
    }

    function setBusy(on) {
      busy = !!on;
      file.disabled = busy;
      uploadBtn.disabled = busy;
      downloadBtn.disabled = busy;
      clearBtn.disabled = busy;
    }

    function doUpload(f) {
      if (!f || busy) return;
      setBusy(true);
      progress.setProgress(0);
      rasterizeImageFileForIcon(f)
        .then(function (ready) {
          return uploadFile(
            ready,
            function (pct) {
              progress.setProgress(pct);
            },
            { intent: "social-icon" },
          );
        })
        .then(function (url) {
          progress.hide();
          setBusy(false);
          file.value = "";
          if (url) {
            record[key] = url;
            refresh();
          }
        })
        .catch(function (err) {
          progress.hide();
          setBusy(false);
          file.value = "";
          alert((err && err.message) || "Upload failed.");
        });
    }

    uploadBtn.addEventListener("click", function () {
      if (busy) return;
      triggerFilePicker(file);
    });
    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      if (!f) return;
      doUpload(f);
    });
    bindMediaDropZone(box, {
      kind: "image",
      disabled: function () {
        return busy;
      },
      onFile: doUpload,
    });

    downloadBtn.addEventListener("click", function () {
      if (busy) return;
      var custom = customSrc();
      var iconKey = record.icon || "icon";
      var base = String(iconKey).replace(/[^a-z0-9_-]+/gi, "-") || "social";
      if (custom) {
        var href = previewSrc(custom);
        fetch(href, { cache: "no-store" })
          .then(function (r) {
            if (!r.ok) throw new Error("Download failed.");
            return r.blob();
          })
          .then(function (blob) {
            var ext = "png";
            var m = /\.([a-z0-9]+)$/i.exec(custom);
            if (m) ext = m[1].toLowerCase();
            downloadBlob("auburn-vsa-" + base + "-icon." + ext, blob);
          })
          .catch(function () {
            // Fallback: navigate (may open instead of download for some MIME types).
            var a = document.createElement("a");
            a.href = href;
            a.download = "auburn-vsa-" + base + "-icon.png";
            a.target = "_blank";
            a.rel = "noopener";
            document.body.appendChild(a);
            a.click();
            a.remove();
          });
        return;
      }
      var doc = builtInSocialSvgDocument(iconKey);
      if (!doc) {
        alert("No built-in icon to download for this network.");
        return;
      }
      downloadBlob(
        "auburn-vsa-" + base + "-icon.svg",
        new Blob([doc], { type: "image/svg+xml;charset=utf-8" }),
      );
    });

    clearBtn.addEventListener("click", function () {
      if (busy) return;
      if (!customSrc()) return;
      if (!confirm("Remove the custom icon and use the built-in one?")) return;
      record[key] = "";
      refresh();
    });

    // When the sibling “Built-in icon” select changes, refresh the SVG preview.
    setTimeout(function () {
      var itemBody = box.parentElement && box.parentElement.parentElement;
      if (!itemBody) return;
      itemBody.addEventListener("change", function (e) {
        var t = e.target;
        if (t && t.tagName === "SELECT") refresh();
      });
    }, 0);

    box.appendChild(preview);
    box.appendChild(status);
    box.appendChild(file);
    box.appendChild(actions);
    box.appendChild(progress.el);
    box.appendChild(hint);
    file.hidden = true;
    refresh();
    return box;
  }

  function openUploadLibrary(onPick) {
    return new Promise(function (resolve) {
      var settled = false;
      function finish(url) {
        if (settled) return;
        settled = true;
        document.removeEventListener("keydown", onKey);
        overlay.classList.remove("is-open");
        overlay.setAttribute("data-closing", "1");
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.body.classList.remove("admin-sheet-lock");
        releaseAdminUiLocks();
        if (url) {
          if (typeof onPick === "function") onPick(url);
          resolve(url);
        } else {
          resolve("");
        }
      }

      var overlay = el("div", { class: "admin-sheet upload-library-sheet is-open", "aria-hidden": "false" });
      var backdrop = el("div", { class: "admin-sheet-backdrop" });
      var panel = el("div", {
        class: "admin-sheet-panel upload-library-panel",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Choose from uploads",
      });
      var head = el("header", { class: "admin-sheet-head" });
      head.appendChild(el("h2", { text: "Upload library" }));
      var closeBtn = el("button", {
        type: "button",
        class: "admin-sheet-close",
        "aria-label": "Close",
        text: "×",
      });
      head.appendChild(closeBtn);
      panel.appendChild(head);
      var body = el("div", { class: "admin-sheet-body" });
      var status = el("p", { class: "muted", text: "Loading recent images…" });
      var grid = el("div", { class: "upload-library-grid" });
      body.appendChild(status);
      body.appendChild(grid);
      panel.appendChild(body);
      overlay.appendChild(backdrop);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      document.body.classList.add("admin-sheet-lock");

      function onKey(e) {
        if (e.key === "Escape") finish("");
      }
      document.addEventListener("keydown", onKey);
      closeBtn.addEventListener("click", function () {
        finish("");
      });
      backdrop.addEventListener("click", function () {
        finish("");
      });

      fetch("upload.php?action=list&limit=60", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": window.CSRF_TOKEN || "" },
      })
        .then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok || !data || !data.ok) {
              throw new Error((data && data.error) || "Could not load uploads.");
            }
            return data.items || [];
          });
        })
        .then(function (items) {
          if (settled) return;
          grid.innerHTML = "";
          if (!items.length) {
            status.textContent = "No uploaded images yet. Upload one first.";
            return;
          }
          status.textContent = "Pick a recent image (" + items.length + ").";
          items.forEach(function (item) {
            var btn = el("button", {
              type: "button",
              class: "upload-library-item",
              title: item.name || "",
            });
            var img = el("img", {
              src: previewSrc(item.url),
              alt: item.name || "Upload",
              loading: "lazy",
              draggable: "false",
            });
            btn.appendChild(img);
            btn.addEventListener("click", function () {
              finish(item.url || "");
            });
            grid.appendChild(btn);
          });
        })
        .catch(function (err) {
          if (settled) return;
          status.className = "error";
          status.textContent = (err && err.message) || "Could not load uploads.";
        });
    });
  }

  function imageControl(get, set, options) {
    options = options || {};
    var cropAspect = options.cropAspect || "free";
    var skipAdjust = !!options.skipAdjust;
    var maxEdge = Math.max(512, Math.min(4096, parseInt(options.maxEdge, 10) || 2400));
    var fieldKey = options.fieldKey || "";
    var onUploaded = typeof options.onUploaded === "function" ? options.onUploaded : null;
    var box = el("div", { class: "imgctl", "aria-label": "Image upload. Drop a file here or choose one." });
    var preview = el("img", { class: "preview", alt: "" });
    preview.draggable = false;
    var dropHint = el("p", {
      class: "imgctl-drop-hint",
      text: skipAdjust
        ? "Drop an image here, choose a file, or paste a URL below"
        : "Drop an image here, choose a file, paste (Ctrl+V), or paste a URL below",
    });
    var file = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif" });
    var url = el("input", { type: "text", placeholder: "…or paste an image URL / link" });
    var library = el("button", { type: "button", class: "btn-outline", text: "Library" });
    var adjust = el("button", { type: "button", class: "btn-outline", text: "Adjust" });
    var clear = el("button", { type: "button", class: "link-danger", text: "Clear image" });
    var actions = el("div", { class: "imgctl-actions" }, [library, adjust, clear]);
    var progress = makeUploadProgress();
    var busy = false;

    function refresh() {
      var v = get();
      if (v) {
        preview.src = previewSrc(v);
        preview.style.display = "block";
        adjust.style.display = "";
      } else {
        preview.style.display = "none";
        adjust.style.display = "none";
      }
      url.value = v || "";
    }

    function applyUploaded(fileOrUrl) {
      if (!fileOrUrl) return Promise.resolve();
      if (typeof fileOrUrl === "string") {
        set(fileOrUrl);
        refresh();
        if (onUploaded) onUploaded(fileOrUrl);
        return Promise.resolve(fileOrUrl);
      }
      busy = true;
      progress.setProgress(0);
      file.disabled = true;
      adjust.disabled = true;
      library.disabled = true;
      return uploadFile(fileOrUrl, function (pct) {
        progress.setProgress(pct);
      }, fieldKey ? { field: fieldKey } : null)
        .then(function (u) {
          progress.hide();
          busy = false;
          file.disabled = false;
          adjust.disabled = false;
          library.disabled = false;
          if (u) {
            set(u);
            refresh();
            if (onUploaded) onUploaded(u);
          }
          return u;
        })
        .catch(function (err) {
          progress.hide();
          busy = false;
          file.disabled = false;
          adjust.disabled = false;
          library.disabled = false;
          return Promise.reject(err);
        });
    }

    function handlePickedFile(f) {
      if (!f || busy) return;
      if (skipAdjust) {
        applyUploaded(f).catch(function (err) {
          alert((err && err.message) || "Upload failed.");
        });
        return;
      }
      openImageAdjuster(f, { cropAspect: cropAspect, maxEdge: maxEdge })
        .then(function (out) {
          file.value = "";
          if (!out) return;
          return applyUploaded(out);
        })
        .catch(function (err) {
          file.value = "";
          alert((err && err.message) || "Could not open image editor.");
        });
    }

    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      if (!f) return;
      handlePickedFile(f);
    });

    bindMediaDropZone(box, {
      kind: "image",
      disabled: function () {
        return busy;
      },
      onFile: handlePickedFile,
    });

    library.addEventListener("click", function () {
      if (busy) return;
      openUploadLibrary().then(function (picked) {
        if (!picked) return;
        applyUploaded(picked);
      });
    });

    adjust.addEventListener("click", function () {
      var v = get();
      if (!v || busy) return;
      openImageAdjuster(previewSrc(v), { cropAspect: cropAspect, maxEdge: maxEdge })
        .then(function (out) {
          if (!out) return;
          return applyUploaded(out);
        })
        .catch(function (err) {
          alert((err && err.message) || "Could not open image editor.");
        });
    });

    url.addEventListener("input", function () {
      set(url.value);
      refresh();
    });
    url.addEventListener("change", function () {
      var v = (url.value || "").trim();
      set(v);
      refresh();
      if (v && onUploaded) onUploaded(v);
    });
    clear.addEventListener("click", function () {
      set("");
      refresh();
      if (onUploaded) onUploaded("");
    });

    box.appendChild(preview);
    box.appendChild(dropHint);
    box.appendChild(file);
    box.appendChild(url);
    box.appendChild(actions);
    box.appendChild(progress.el);
    refresh();
    return box;
  }

  function parseYouTubeId(url) {
    // Keep in sync with assets/js/site.js parseYouTubeId.
    if (!url) return "";
    var m = String(url).trim().match(
      /(?:youtube\.com\/(?:watch\?(?:[^&#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
    );
    return m ? m[1] : "";
  }

  function parseVimeoId(url) {
    // Keep in sync with assets/js/site.js parseVimeoId.
    if (!url) return "";
    var m = String(url).trim().match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    return m ? m[1] : "";
  }

  function videoControl(get, set) {
    var box = el("div", {
      class: "imgctl vidctl",
      "aria-label": "Video upload. Drop a file here or choose one.",
    });
    var previewVideo = el("video", { class: "preview-video", controls: "controls" });
    previewVideo.setAttribute("playsinline", "");
    var previewEmbed = el("iframe", {
      class: "preview-embed",
      title: "Video preview",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    });
    previewEmbed.setAttribute("allowfullscreen", "");
    previewEmbed.setAttribute("loading", "lazy");
    var dropHint = el("p", {
      class: "imgctl-drop-hint",
      text: "Drop a video here, choose a file, or paste a YouTube / Vimeo / MP4 URL",
    });
    var file = el("input", {
      type: "file",
      accept: "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov",
    });
    var url = el("input", {
      type: "text",
      placeholder: "…or paste YouTube / Vimeo / MP4 URL",
    });
    var clear = el("button", { type: "button", class: "link-danger", text: "Clear video" });
    var hint = el("p", {
      class: "muted",
      text: "Paste a YouTube link, Vimeo link, or direct MP4/WEBM URL — or upload a file (max 80 MB).",
    });
    var progress = makeUploadProgress();
    var busy = false;
    hint.style.fontSize = "0.75rem";
    hint.style.marginTop = "0.35rem";

    function refresh() {
      var v = (get() || "").trim();
      url.value = v;
      var yt = parseYouTubeId(v);
      var vim = parseVimeoId(v);
      previewVideo.style.display = "none";
      previewEmbed.style.display = "none";
      previewVideo.removeAttribute("src");
      previewEmbed.removeAttribute("src");
      if (!v) return;
      if (yt) {
        previewEmbed.src = "https://www.youtube.com/embed/" + yt;
        previewEmbed.style.display = "block";
      } else if (vim) {
        previewEmbed.src = "https://player.vimeo.com/video/" + vim;
        previewEmbed.style.display = "block";
      } else {
        previewVideo.src = previewSrc(v);
        previewVideo.style.display = "block";
      }
    }

    function handleVideoFile(f) {
      if (!f || busy) return;
      busy = true;
      progress.setProgress(0);
      file.disabled = true;
      uploadFile(f, function (pct) {
        progress.setProgress(pct);
      })
        .then(function (u) {
          progress.hide();
          busy = false;
          file.disabled = false;
          if (u) {
            set(u);
            refresh();
          }
          file.value = "";
        })
        .catch(function () {
          progress.hide();
          busy = false;
          file.disabled = false;
          file.value = "";
        });
    }

    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      if (!f) return;
      handleVideoFile(f);
    });

    bindMediaDropZone(box, {
      kind: "video",
      paste: false,
      disabled: function () {
        return busy;
      },
      onFile: handleVideoFile,
    });

    url.addEventListener("input", function () {
      set(url.value.trim());
      refresh();
    });
    clear.addEventListener("click", function () {
      set("");
      refresh();
    });

    box.appendChild(previewVideo);
    box.appendChild(previewEmbed);
    box.appendChild(dropHint);
    box.appendChild(file);
    box.appendChild(progress.el);
    box.appendChild(url);
    box.appendChild(clear);
    box.appendChild(hint);
    refresh();
    return box;
  }

  function audioControl(get, set) {
    var box = el("div", {
      class: "imgctl audioctl",
      "aria-label": "Audio upload. Drop a file here or choose one.",
    });
    var preview = el("audio", { class: "preview-audio", controls: "controls" });
    preview.setAttribute("preload", "metadata");
    var dropHint = el("p", {
      class: "imgctl-drop-hint",
      text: "Drop an audio file here or choose one",
    });
    var file = el("input", {
      type: "file",
      accept: "audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm,.mp3,.m4a,.ogg,.wav,.weba",
    });
    var clear = el("button", { type: "button", class: "link-danger", text: "Clear audio" });
    var hint = el("p", {
      class: "muted",
      text: "MP3, M4A, OGG, or WAV — max 25 MB. Use Title above to rename how it appears in the player.",
    });
    var progress = makeUploadProgress();
    var busy = false;
    hint.style.fontSize = "0.75rem";
    hint.style.marginTop = "0.35rem";

    function refresh() {
      var v = (get() || "").trim();
      preview.style.display = "none";
      preview.removeAttribute("src");
      if (!v) return;
      preview.src = previewSrc(v);
      preview.style.display = "block";
    }

    function handleAudioFile(f) {
      if (!f || busy) return;
      if (!isAudioFile(f)) {
        alert("Please choose an audio file (MP3, M4A, OGG, or WAV).");
        return;
      }
      busy = true;
      progress.setProgress(0);
      file.disabled = true;
      uploadFile(
        f,
        function (pct) {
          progress.setProgress(pct);
        },
        { intent: "audio" },
      )
        .then(function (u) {
          progress.hide();
          busy = false;
          file.disabled = false;
          if (u) {
            set(u);
            refresh();
          }
          file.value = "";
        })
        .catch(function () {
          progress.hide();
          busy = false;
          file.disabled = false;
          file.value = "";
        });
    }

    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      if (!f) return;
      handleAudioFile(f);
    });

    bindMediaDropZone(box, {
      kind: "audio",
      paste: false,
      disabled: function () {
        return busy;
      },
      onFile: handleAudioFile,
    });

    clear.addEventListener("click", function () {
      set("");
      refresh();
    });

    box.appendChild(preview);
    box.appendChild(dropHint);
    box.appendChild(file);
    box.appendChild(progress.el);
    box.appendChild(clear);
    box.appendChild(hint);
    refresh();
    return box;
  }

  function blankMember() {
    return { role: "", name: "", email: "", bio: "", image: "", visible: "yes" };
  }

  function clampBio(text) {
    var lines = String(text || "")
      .replace(/\r\n/g, "\n")
      .split("\n");
    if (lines.length > 4) lines = lines.slice(0, 4);
    return lines.join("\n");
  }

  function openMemberEditor(member, onDone) {
    var draft = {
      role: member.role || "",
      name: member.name || "",
      email: member.email || "",
      bio: clampBio(member.bio || ""),
      image: member.image || "",
      visible: itemIsVisible(member) ? "yes" : "no",
    };

    var overlay = el("div", { class: "imgadj-overlay" });
    var modal = el("div", { class: "imgadj member-modal" });
    modal.appendChild(el("h2", { text: draft.name || draft.role ? "Edit member" : "Add member" }));

    memberFields().forEach(function (f) {
      modal.appendChild(fieldEditor(draft, f));
    });

    function close(saved) {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.removeEventListener("keydown", onMemberKey);
      releaseAdminUiLocks();
      onDone(saved ? draft : null);
    }

    function onMemberKey(e) {
      if (e.key !== "Escape") return;
      if (isFileDialogOpen()) return;
      // Nested crop overlay sits above this member editor.
      var overlays = document.querySelectorAll(".imgadj-overlay");
      if (overlays.length && overlays[overlays.length - 1] !== overlay) return;
      close(false);
    }

    var cancel = el("button", { type: "button", class: "btn-ghost", text: "Cancel" });
    cancel.addEventListener("click", function () {
      close(false);
    });
    var save = el("button", { type: "button", class: "btn btn-orange", text: "Done" });
    save.addEventListener("click", function () {
      draft.bio = clampBio(draft.bio);
      close(true);
    });
    modal.appendChild(el("div", { class: "imgadj-actions" }, [cancel, save]));
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.addEventListener("keydown", onMemberKey);
  }

  function teamRosterEditor(teamData) {
    var wrap = el("div", { class: "team-roster" });
    TEAM_TABS.forEach(function (tab) {
      if (!Array.isArray(teamData[tab.key])) teamData[tab.key] = [];
    });
    if (!teamData.intros || typeof teamData.intros !== "object") teamData.intros = {};
    if (!teamData.pageTitles || typeof teamData.pageTitles !== "object") teamData.pageTitles = {};
    if (!teamData.sectionHeadings || typeof teamData.sectionHeadings !== "object") {
      teamData.sectionHeadings = {};
    }
    if (teamData.cycleLabel == null) teamData.cycleLabel = "Also meet";

    var tabBar = el("div", { class: "team-tabs" });
    var titleBlock = el("div", { class: "field team-intro-field" });
    titleBlock.appendChild(
      el("label", {
        text: "Page title (use | for orange words, e.g. VSA | Executive Board)",
      }),
    );
    var titleInput = el("input", {
      type: "text",
      placeholder: "VSA | Executive Board",
    });
    titleInput.addEventListener("input", function () {
      teamData.pageTitles[teamTabKey] = titleInput.value;
    });
    titleBlock.appendChild(titleInput);

    var headingBlock = el("div", { class: "field team-intro-field" });
    headingBlock.appendChild(
      el("label", {
        text: "Section heading (use | for orange words, e.g. Meet the | Executive Board)",
      }),
    );
    var headingInput = el("input", {
      type: "text",
      placeholder: "Meet the | Executive Board",
    });
    headingInput.addEventListener("input", function () {
      teamData.sectionHeadings[teamTabKey] = headingInput.value;
    });
    headingBlock.appendChild(headingInput);

    var cycleBlock = el("div", { class: "field team-intro-field" });
    cycleBlock.appendChild(el("label", { text: "Also-meet label (all team pages)" }));
    var cycleInput = el("input", { type: "text", placeholder: "Also meet" });
    cycleInput.value = teamData.cycleLabel || "Also meet";
    cycleInput.addEventListener("input", function () {
      teamData.cycleLabel = cycleInput.value;
    });
    cycleBlock.appendChild(cycleInput);

    var introBlock = el("div", { class: "field team-intro-field" });
    var introLabel = el("label", {
      text: "Page description (shown under the title on this team page)",
    });
    introBlock.appendChild(introLabel);
    var introInput = el("textarea", { rows: "4", placeholder: "Short intro for this team page…" });
    introInput.addEventListener("input", function () {
      teamData.intros[teamTabKey] = introInput.value;
    });
    introBlock.appendChild(introInput);
    var hint = el("p", {
      class: "muted team-drag-hint",
      text: "Drag cards (or use ↑ ↓) to change placement. Save Team when done.",
    });
    var grid = el("div", { class: "member-cards" });
    var addBtn = el("button", { type: "button", class: "btn-outline", text: "+ Add member" });
    addBtn.style.marginTop = "0.75rem";
    var dragFrom = null;

    function currentList() {
      return teamData[teamTabKey];
    }

    function syncIntro() {
      if (teamData.intros[teamTabKey] == null) teamData.intros[teamTabKey] = "";
      if (teamData.pageTitles[teamTabKey] == null) teamData.pageTitles[teamTabKey] = "";
      if (teamData.sectionHeadings[teamTabKey] == null) teamData.sectionHeadings[teamTabKey] = "";
      introInput.value = teamData.intros[teamTabKey] || "";
      titleInput.value = teamData.pageTitles[teamTabKey] || "";
      headingInput.value = teamData.sectionHeadings[teamTabKey] || "";
      cycleInput.value = teamData.cycleLabel || "Also meet";
      var tabLabel = "this team page";
      for (var t = 0; t < TEAM_TABS.length; t++) {
        if (TEAM_TABS[t].key === teamTabKey) {
          tabLabel = TEAM_TABS[t].label;
          break;
        }
      }
      introLabel.textContent =
        "Page description (shown under the title on " + tabLabel + ")";
    }

    function syncTeamPreviewLink() {
      var view = document.querySelector("#admin-panel .admin-view-page");
      if (view) view.setAttribute("href", teamPreviewHref());
    }

    function moveMember(from, to) {
      var list = currentList();
      if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
      var item = list.splice(from, 1)[0];
      list.splice(to, 0, item);
      renderCards();
      renderTabs();
    }

    function renderTabs() {
      tabBar.innerHTML = "";
      TEAM_TABS.forEach(function (tab) {
        var btn = el("button", {
          type: "button",
          class: "team-tab" + (tab.key === teamTabKey ? " active" : ""),
          text: tab.label + " (" + (teamData[tab.key] || []).length + ")",
        });
        btn.addEventListener("click", function () {
          teamTabKey = tab.key;
          renderTabs();
          syncIntro();
          syncTeamPreviewLink();
          renderCards();
        });
        tabBar.appendChild(btn);
      });
    }

    function renderCards() {
      grid.innerHTML = "";
      dragFrom = null;
      var list = currentList();
      if (!list.length) {
        grid.appendChild(
          el("p", {
            class: "muted",
            text: "No members yet. Add someone to get started.",
          }),
        );
        return;
      }
      list.forEach(function (member, i) {
        var card = el("article", {
          class: "member-card" + (itemIsVisible(member) ? "" : " is-inactive"),
          draggable: "true",
          "data-index": String(i),
        });

        var handle = el("button", {
          type: "button",
          class: "member-card-handle",
          title: "Drag to reorder",
          "aria-label": "Drag to reorder",
          text: "⠿",
        });
        // Keep handle from stealing clicks; dragging works on the whole card
        handle.addEventListener("mousedown", function (e) {
          e.stopPropagation();
        });

        var photo = el("div", { class: "member-card-photo" });
        if (member.image) {
          photo.appendChild(el("img", { src: previewSrc(member.image), alt: "", draggable: "false" }));
        } else {
          photo.appendChild(el("span", { class: "member-card-ph", text: "No photo" }));
        }
        var info = el("div", { class: "member-card-info" });
        info.appendChild(el("h3", { text: member.role || "Untitled role" }));
        info.appendChild(el("p", { class: "member-card-name", text: member.name || "No name" }));
        if (!itemIsVisible(member)) {
          info.appendChild(el("p", { class: "member-card-inactive", text: "Hidden on site" }));
        }
        if (member.email) {
          info.appendChild(el("p", { class: "member-card-email", text: member.email }));
        }
        if (member.bio) {
          info.appendChild(el("p", { class: "member-card-bio", text: clampBio(member.bio) }));
        }
        var actions = el("div", { class: "member-card-actions" });

        var up = el("button", {
          type: "button",
          class: "btn-outline member-move",
          text: "↑",
          title: "Move earlier",
          "aria-label": "Move earlier",
        });
        up.disabled = i === 0;
        up.addEventListener("click", function (e) {
          e.stopPropagation();
          moveMember(i, i - 1);
        });
        var down = el("button", {
          type: "button",
          class: "btn-outline member-move",
          text: "↓",
          title: "Move later",
          "aria-label": "Move later",
        });
        down.disabled = i === list.length - 1;
        down.addEventListener("click", function (e) {
          e.stopPropagation();
          moveMember(i, i + 1);
        });

        var edit = el("button", { type: "button", class: "btn-outline", text: "Edit" });
        edit.addEventListener("click", function (e) {
          e.stopPropagation();
          openMemberEditor(member, function (draft) {
            if (!draft) return;
            list[i] = draft;
            renderCards();
            renderTabs();
          });
        });
        var del = el("button", { type: "button", class: "link-danger", text: "Delete" });
        del.addEventListener("click", function (e) {
          e.stopPropagation();
          if (!confirm("Delete this member?")) return;
          list.splice(i, 1);
          renderCards();
          renderTabs();
        });
        actions.appendChild(up);
        actions.appendChild(down);
        actions.appendChild(edit);
        actions.appendChild(del);

        card.appendChild(handle);
        card.appendChild(photo);
        card.appendChild(info);
        card.appendChild(actions);

        card.addEventListener("dragstart", function (e) {
          dragFrom = i;
          card.classList.add("is-dragging");
          try {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(i));
          } catch (err) {}
        });
        card.addEventListener("dragend", function () {
          dragFrom = null;
          card.classList.remove("is-dragging");
          grid.querySelectorAll(".member-card.is-drop-target").forEach(function (c) {
            c.classList.remove("is-drop-target");
          });
        });
        card.addEventListener("dragover", function (e) {
          e.preventDefault();
          try {
            e.dataTransfer.dropEffect = "move";
          } catch (err) {}
          if (dragFrom === null || dragFrom === i) return;
          grid.querySelectorAll(".member-card.is-drop-target").forEach(function (c) {
            c.classList.remove("is-drop-target");
          });
          card.classList.add("is-drop-target");
        });
        card.addEventListener("dragleave", function () {
          card.classList.remove("is-drop-target");
        });
        card.addEventListener("drop", function (e) {
          e.preventDefault();
          card.classList.remove("is-drop-target");
          var from = dragFrom;
          if (from === null) {
            try {
              from = parseInt(e.dataTransfer.getData("text/plain"), 10);
            } catch (err) {
              from = NaN;
            }
          }
          if (isNaN(from) || from === i) return;
          moveMember(from, i);
        });

        grid.appendChild(card);
      });
    }

    addBtn.addEventListener("click", function () {
      openMemberEditor(blankMember(), function (draft) {
        if (!draft) return;
        currentList().push(draft);
        renderCards();
        renderTabs();
      });
    });

    renderTabs();
    syncIntro();
    renderCards();
    wrap.appendChild(tabBar);
    var labelsCard = makeAdminFieldGroup("Page labels", false);
    labelsCard.body.appendChild(titleBlock);
    labelsCard.body.appendChild(headingBlock);
    labelsCard.body.appendChild(cycleBlock);
    labelsCard.body.appendChild(introBlock);
    wrap.appendChild(labelsCard.details);
    wrap.appendChild(hint);
    wrap.appendChild(grid);
    wrap.appendChild(addBtn);
    return wrap;
  }

  function listItemSummary(item, itemDef, itemLabel, index) {
    if (itemDef === "image") {
      return item ? "Photo added" : "Empty photo slot";
    }
    if (!item || typeof item !== "object") {
      return itemLabel + " " + (index + 1);
    }
    var title = "";
    var prefer = ["name", "title", "question", "label", "role", "heading"];
    for (var p = 0; p < prefer.length; p++) {
      var val = item[prefer[p]];
      if (val && String(val).trim()) {
        title = String(val).trim();
        break;
      }
    }
    if (!title && item.date && String(item.date).trim()) title = String(item.date).trim();
    if (!title && item.price && String(item.price).trim()) title = String(item.price).trim();
    if (!title) title = (itemLabel || "Item") + " " + (index + 1);

    var bits = [title];
    if (item.price && String(item.price).trim() && title.indexOf(String(item.price).trim()) === -1) {
      bits.push(String(item.price).trim());
    }
    if (item.status && String(item.status).trim()) {
      bits.push(String(item.status).trim());
    }
    if (item.showOnHome === "yes" || item.showOnHome === true) {
      bits.push("On home");
    }
    var line = bits.join(" · ");
    if (!itemIsVisible(item)) return "Hidden · " + line;
    return line;
  }

  function listItemDate(item, itemDef) {
    if (itemDef === "image" || !item || typeof item !== "object") return "";
    return item.date && String(item.date).trim() ? String(item.date).trim() : "";
  }

  function listItemThumbSrc(item, itemDef) {
    if (itemDef === "image") return typeof item === "string" ? item : "";
    if (!item || typeof item !== "object") return "";
    if (item.image) return typeof item.image === "string" ? item.image : item.image.src || "";
    if (item.videoImage) return typeof item.videoImage === "string" ? item.videoImage : "";
    if (item.poster) return typeof item.poster === "string" ? item.poster : "";
    return "";
  }

  function listItemIconKey(item, itemDef) {
    if (itemDef === "image" || !item || typeof item !== "object") return "";
    if (Array.isArray(itemDef)) {
      var hasIcon = false;
      for (var i = 0; i < itemDef.length; i++) {
        if (itemDef[i] && itemDef[i].key === "icon") {
          hasIcon = true;
          break;
        }
      }
      if (!hasIcon) return "";
    }
    var icon = item.icon;
    return icon && String(icon).trim() ? String(icon).trim() : "";
  }

  function normalizeGalleryData(gallery) {
    if (!gallery || typeof gallery !== "object") gallery = {};
    if ((!gallery.years || !gallery.years.length) && (gallery.year || gallery.videoUrl || (gallery.categories && gallery.categories.length))) {
      gallery.years = [
        {
          id: "2025-2026",
          label: gallery.year || "2025 - 2026",
          videoUrl: gallery.videoUrl || "",
          videoImage: gallery.videoImage || "",
          categories: gallery.categories || [],
        },
      ];
      if (!gallery.activeYearId) gallery.activeYearId = "2025-2026";
    }
    if (!Array.isArray(gallery.years)) gallery.years = [];
    gallery.years = gallery.years.map(function (y, i) {
      if (!y || typeof y !== "object") {
        return { id: "year-" + i, label: "Year " + (i + 1), videoUrl: "", videoImage: "", categories: [] };
      }
      var cats = Array.isArray(y.categories) ? y.categories : [];
      cats = cats.map(function (cat) {
        if (!cat || typeof cat !== "object") return { name: "", image: "", images: [] };
        var album = Array.isArray(cat.images) ? cat.images : [];
        album = album
          .map(function (item) {
            if (typeof item === "string") return { image: item };
            if (!item || typeof item !== "object") return { image: "" };
            return { image: item.image || "" };
          })
          .filter(function (item) {
            return item.image;
          });
        return {
          name: cat.name || "",
          image: cat.image || "",
          images: album,
        };
      });
      return {
        id: y.id || "year-" + i,
        label: y.label || y.id || "Year " + (i + 1),
        videoUrl: y.videoUrl || "",
        videoImage: y.videoImage || "",
        categories: cats,
      };
    });
    if (!gallery.activeYearId && gallery.years[0]) gallery.activeYearId = gallery.years[0].id;
    return gallery;
  }

  var galleryYearTabId = "";

  function galleryYearsEditor(galleryData) {
    normalizeGalleryData(galleryData);

    var wrap = el("div", { class: "gallery-years-editor" });
    var pageHeadingCard = makeAdminFieldGroup("Page heading", false);
    var pageHeadingField = el("div", { class: "field" }, [
      el("label", { text: "Page heading" }),
    ]);
    var pageHeadingInput = el("input", {
      type: "text",
      value: galleryData.pageHeading || "Gallery",
    });
    pageHeadingInput.addEventListener("input", function () {
      galleryData.pageHeading = pageHeadingInput.value;
    });
    pageHeadingField.appendChild(pageHeadingInput);
    pageHeadingCard.body.appendChild(pageHeadingField);
    var tabBar = el("div", { class: "team-tabs gallery-year-tabs" });
    var body = el("div", { class: "gallery-year-body" });

    function ensureTab() {
      if (!galleryData.years.length) {
        galleryYearTabId = "";
        return null;
      }
      var found = galleryData.years.some(function (y) {
        return y.id === galleryYearTabId;
      });
      if (!found) galleryYearTabId = galleryData.years[0].id;
      return galleryData.years.find(function (y) {
        return y.id === galleryYearTabId;
      });
    }

    function renderTabs() {
      tabBar.innerHTML = "";
      galleryData.years.forEach(function (y) {
        var count = (y.categories || []).length;
        var btn = el("button", {
          type: "button",
          class: "team-tab" + (y.id === galleryYearTabId ? " active" : ""),
          text: (y.label || y.id) + (count ? " (" + count + ")" : ""),
        });
        btn.addEventListener("click", function () {
          galleryYearTabId = y.id;
          renderAll();
        });
        tabBar.appendChild(btn);
      });
      var addYear = el("button", {
        type: "button",
        class: "team-tab gallery-year-add-tab",
        text: "+ Year",
      });
      addYear.addEventListener("click", function () {
        var n = galleryData.years.length + 1;
        var id = "year-" + Date.now().toString(36);
        galleryData.years.push({
          id: id,
          label: "New year " + n,
          videoUrl: "",
          videoImage: "",
          categories: [
            { name: "General Body Meetings", image: "", images: [] },
            { name: "Events", image: "", images: [] },
            { name: "Auburn Royale", image: "", images: [] },
          ],
        });
        if (!galleryData.activeYearId) galleryData.activeYearId = id;
        galleryYearTabId = id;
        renderAll();
      });
      tabBar.appendChild(addYear);
    }

    function renderBody() {
      body.innerHTML = "";
      var year = ensureTab();
      if (!year) {
        body.appendChild(
          el("p", {
            class: "muted",
            text: "No school years yet. Click + Year to add one.",
          }),
        );
        return;
      }

      body.appendChild(
        el("p", {
          class: "muted gallery-year-hint",
          text: "Albums stay as compact bars — click Edit to open one in a popup.",
        }),
      );

      var defaultRow = el("div", { class: "field gallery-default-year" });
      defaultRow.appendChild(
        el("label", { text: "Default year on the public Gallery page (all tabs)" }),
      );
      var defSelect = el("select");
      galleryData.years.forEach(function (y) {
        var o = el("option", { value: y.id, text: y.label || y.id });
        if (galleryData.activeYearId === y.id) o.selected = true;
        defSelect.appendChild(o);
      });
      defSelect.addEventListener("change", function () {
        galleryData.activeYearId = defSelect.value;
      });
      defaultRow.appendChild(defSelect);
      defaultRow.appendChild(
        el("p", {
          class: "muted",
          text: "Controls which school year visitors see first — not only the tab you are editing.",
        }),
      );
      body.appendChild(defaultRow);

      var labelField = fieldEditor(year, { key: "label", label: "Dropdown label", type: "text" });
      var labelInput = labelField.querySelector("input");
      if (labelInput) {
        labelInput.addEventListener("input", function () {
          renderTabs();
        });
      }
      body.appendChild(labelField);
      var idField = fieldEditor(year, {
        key: "id",
        label: "Year id (advanced — dropdown value)",
        type: "text",
        hint: "Usually leave alone. Changing it can break bookmarked year links.",
      });
      var idInput = idField.querySelector("input");
      if (idInput) {
        function commitYearId() {
          var next = String(year.id || "").trim();
          if (!next) {
            next = String(year.label || "")
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9._-]/g, "") || "year";
          }
          var base = next;
          var n = 2;
          while (
            (galleryData.years || []).some(function (y) {
              return y !== year && String(y.id || "") === next;
            })
          ) {
            next = base + "-" + n;
            n += 1;
          }
          year.id = next;
          idInput.value = next;
          if (galleryData.activeYearId === galleryYearTabId) {
            galleryData.activeYearId = year.id;
          }
          galleryYearTabId = year.id;
          renderTabs();
        }
        idInput.addEventListener("input", function () {
          galleryYearTabId = String(year.id || "");
          renderTabs();
        });
        idInput.addEventListener("change", commitYearId);
        idInput.addEventListener("blur", commitYearId);
      }
      body.appendChild(idField);
      body.appendChild(
        fieldEditor(year, {
          key: "videoUrl",
          label: "Featured / end-of-year video",
          type: "video",
        }),
      );
      body.appendChild(
        fieldEditor(year, {
          key: "videoImage",
          label: "Video poster / thumbnail",
          type: "image",
        }),
      );

      body.appendChild(el("h2", { class: "group-title", text: "Albums" }));
      if (!Array.isArray(year.categories)) year.categories = [];
      body.appendChild(
        listEditor(
          year.categories,
          [
            { key: "name", label: "Name", type: "text" },
            { key: "image", label: "Cover image", type: "image" },
            {
              key: "images",
              label: "Album photos (shown in View popup)",
              type: "imageList",
              itemLabel: "Photo",
            },
            VISIBLE_FIELD,
          ],
          "Album",
        ),
      );

      var del = el("button", {
        type: "button",
        class: "link-danger gallery-year-delete",
        text: "Delete this school year",
      });
      del.style.marginTop = "1rem";
      del.addEventListener("click", function () {
        if (!confirm("Delete “" + (year.label || year.id) + "” and all of its albums?")) return;
        var idx = galleryData.years.indexOf(year);
        if (idx < 0) return;
        galleryData.years.splice(idx, 1);
        if (galleryData.activeYearId === year.id) {
          galleryData.activeYearId = galleryData.years[0] ? galleryData.years[0].id : "";
        }
        galleryYearTabId = galleryData.years[0] ? galleryData.years[0].id : "";
        renderAll();
      });
      body.appendChild(del);
    }

    function renderAll() {
      ensureTab();
      renderTabs();
      renderBody();
    }

    wrap.appendChild(pageHeadingCard.details);
    wrap.appendChild(tabBar);
    wrap.appendChild(body);
    renderAll();
    return wrap;
  }

  function openListItemSheet(title, itemDef, draft, onDone) {
    var overlay = el("div", { class: "admin-sheet", "aria-hidden": "false" });
    var backdrop = el("div", { class: "admin-sheet-backdrop" });
    var panel = el("div", {
      class: "admin-sheet-panel",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": title || "Edit item",
    });
    var head = el("header", { class: "admin-sheet-head" });
    head.appendChild(el("h2", { text: title || "Edit item" }));
    var closeBtn = el("button", {
      type: "button",
      class: "admin-sheet-close",
      "aria-label": "Close",
      text: "×",
    });
    head.appendChild(closeBtn);
    panel.appendChild(head);

    var body = el("div", { class: "admin-sheet-body" });
    var working = draft;
    if (itemDef === "image") {
      working = { image: typeof draft === "string" ? draft : "" };
      body.appendChild(
        imageControl(
          function () {
            return working.image || "";
          },
          function (v) {
            working.image = v;
          },
        ),
      );
    } else {
      (itemDef || []).forEach(function (f) {
        body.appendChild(fieldEditor(working, f));
      });
    }
    panel.appendChild(body);

    var actions = el("div", { class: "admin-sheet-actions" });
    var cancel = el("button", { type: "button", class: "btn-ghost", text: "Cancel" });
    var save = el("button", { type: "button", class: "btn btn-orange", text: "Done" });
    actions.appendChild(cancel);
    actions.appendChild(save);
    panel.appendChild(actions);

    overlay.appendChild(backdrop);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.body.classList.add("admin-sheet-lock");
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });

    var closed = false;
    function finish(saved) {
      if (closed) return;
      closed = true;
      // Stop eating clicks immediately (opacity fade would otherwise block the page).
      overlay.style.pointerEvents = "none";
      overlay.setAttribute("aria-hidden", "true");
      overlay.setAttribute("data-closing", "1");
      overlay.classList.remove("is-open");
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.removeEventListener("keydown", onKey);
        if (!document.querySelector(".admin-sheet.is-open")) {
          document.body.classList.remove("admin-sheet-lock");
        }
        releaseAdminUiLocks();
        if (saved) {
          onDone(itemDef === "image" ? working.image || "" : working);
        } else {
          onDone(null);
        }
      }, 280);
    }

    function onKey(e) {
      if (e.key !== "Escape") return;
      // File dialog cancel often delivers Escape to the page — don't close the sheet
      // while a native picker is open (that left an invisible click-blocking overlay).
      if (isFileDialogOpen()) return;
      // Let image crop / nested overlays handle Escape first.
      if (document.querySelector(".imgadj-overlay")) return;
      var sheets = document.querySelectorAll(".admin-sheet");
      if (sheets.length && sheets[sheets.length - 1] !== overlay) return;
      finish(false);
    }

    closeBtn.addEventListener("click", function () {
      finish(false);
    });
    backdrop.addEventListener("click", function () {
      finish(false);
    });
    cancel.addEventListener("click", function () {
      finish(false);
    });
    save.addEventListener("click", function () {
      finish(true);
    });
    document.addEventListener("keydown", onKey);
  }

  function cloneListItem(item, itemDef) {
    if (itemDef === "image") return typeof item === "string" ? item : "";
    try {
      return JSON.parse(JSON.stringify(item && typeof item === "object" ? item : {}));
    } catch (e) {
      return {};
    }
  }

  /** Blank row for listEditor “+ Add” — keep in sync with fieldEditor defaults. */
  function blankListItem(itemDef) {
    if (itemDef === "image") return "";
    var blank = {};
    (itemDef || []).forEach(function (f) {
      if (!f || !f.key) return;
      if (f.type === "imageList" || f.type === "list") {
        blank[f.key] = [];
      } else if (f.type === "select" && f.options && f.options.length) {
        blank[f.key] = selectOptionValue(f.options[0]);
      } else if (f.type === "eventWhen") {
        blank[f.key] = "";
        if (f.key === "date") {
          blank.dateMode = "scheduled";
          blank.dateStart = "";
          blank.timeStart = "";
          blank.timeEnd = "";
        } else {
          blank[f.key + "Mode"] = "scheduled";
          blank[f.key + "Start"] = "";
          blank[f.key + "TimeStart"] = "";
          blank[f.key + "TimeEnd"] = "";
        }
      } else if (f.default != null) {
        blank[f.key] = f.default;
      } else {
        blank[f.key] = "";
      }
    });
    return blank;
  }

  function listEditor(arr, itemDef, itemLabel, options) {
    options = options || {};
    var canReorder = !!options.reorder;
    var emptyText =
      options.emptyText ||
      "No " + String(itemLabel || "item").toLowerCase() + "s yet.";
    var container = el("div", { class: "list-editor" });
    var rows = el("div", { class: "list-rows" });
    var dragFrom = null;
    var sheetOpen = false;
    var reorderHint = null;

    function moveItem(from, to) {
      if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return;
      var item = arr.splice(from, 1)[0];
      arr.splice(to, 0, item);
      dragFrom = null;
      rebuild();
    }

    function openItem(index, isNew) {
      if (sheetOpen) return;
      sheetOpen = true;
      var draft = cloneListItem(arr[index], itemDef);
      var label = (itemLabel || "Item").toLowerCase();
      openListItemSheet((isNew ? "Add " : "Edit ") + label, itemDef, draft, function (result) {
        sheetOpen = false;
        if (result === null) {
          if (isNew) arr.splice(index, 1);
          rebuild();
          return;
        }
        arr[index] = result;
        rebuild();
      });
    }

    function rebuild() {
      rows.innerHTML = "";
      dragFrom = null;
      if (reorderHint) {
        reorderHint.hidden = !canReorder || arr.length < 2;
      }
      if (!arr.length) {
        rows.appendChild(el("p", { class: "muted list-empty", text: emptyText }));
        return;
      }
      arr.forEach(function (item, i) {
        var row = el("div", {
          class:
            "list-row is-collapsed" +
            (canReorder ? " is-reorderable" : "") +
            (item && typeof item === "object" && !itemIsVisible(item) ? " is-inactive" : ""),
        });
        if (canReorder) {
          row.setAttribute("draggable", "true");
          row.setAttribute("data-index", String(i));
        }

        var bar = el("div", { class: "list-row-bar", role: "button", tabindex: "0" });
        var left = el("div", { class: "list-row-bar-left" });

        if (canReorder) {
          var handle = el("button", {
            type: "button",
            class: "list-row-handle",
            title: "Drag to reorder",
            "aria-label": "Drag to reorder",
            text: "⠿",
          });
          handle.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
          });
          left.appendChild(handle);
        }

        var thumbPreview = previewSrc(listItemThumbSrc(item, itemDef));
        var iconKey = listItemIconKey(item, itemDef);
        var iconHtml = !thumbPreview && iconKey ? socialIconSvg(iconKey) : "";
        var isSocialIconRow = !!iconKey || (Array.isArray(itemDef) && itemDef.some(function (f) {
          return f && (f.type === "socialIcon" || f.key === "icon");
        }));
        if (thumbPreview || iconHtml) {
          var thumbWrap = el("span", {
            class:
              "list-row-thumb" +
              (isSocialIconRow || (!thumbPreview && iconHtml) ? " list-row-thumb--icon" : ""),
            "aria-hidden": "true",
          });
          if (thumbPreview) {
            thumbWrap.appendChild(el("img", { src: thumbPreview, alt: "", draggable: "false" }));
          } else {
            thumbWrap.innerHTML = iconHtml;
          }
          left.appendChild(thumbWrap);
        }

        var textCol = el("div", { class: "list-row-text" });
        textCol.appendChild(
          el("span", {
            class: "list-row-summary",
            text: listItemSummary(item, itemDef, itemLabel, i),
          }),
        );
        var dateText = listItemDate(item, itemDef);
        if (dateText) {
          textCol.appendChild(el("span", { class: "list-row-date", text: dateText }));
        }
        left.appendChild(textCol);

        var actions = el("div", { class: "list-row-bar-actions" });

        if (canReorder) {
          var up = el("button", {
            type: "button",
            class: "btn-outline list-row-move",
            text: "↑",
            title: "Move up",
            "aria-label": "Move up",
          });
          up.disabled = i === 0;
          up.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            moveItem(i, i - 1);
          });
          var down = el("button", {
            type: "button",
            class: "btn-outline list-row-move",
            text: "↓",
            title: "Move down",
            "aria-label": "Move down",
          });
          down.disabled = i === arr.length - 1;
          down.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            moveItem(i, i + 1);
          });
          actions.appendChild(up);
          actions.appendChild(down);
        }

        var editBtn = el("button", {
          type: "button",
          class: "btn-outline list-row-toggle",
          text: "Edit",
        });
        editBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          openItem(i, false);
        });
        var remove = el("button", { type: "button", class: "link-danger", text: "Delete" });
        remove.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (!confirm("Delete this " + itemLabel.toLowerCase() + "?")) return;
          arr.splice(i, 1);
          rebuild();
        });
        actions.appendChild(editBtn);
        actions.appendChild(remove);

        bar.appendChild(left);
        bar.appendChild(actions);
        bar.addEventListener("click", function (e) {
          if (e.target.closest && e.target.closest("button, a")) return;
          openItem(i, false);
        });
        bar.addEventListener("keydown", function (e) {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          openItem(i, false);
        });
        row.appendChild(bar);

        if (canReorder) {
          row.addEventListener("dragstart", function (e) {
            if (e.target.closest && e.target.closest("input, textarea, select, a, .imgctl")) {
              e.preventDefault();
              return;
            }
            dragFrom = i;
            row.classList.add("is-dragging");
            try {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", String(i));
            } catch (err) {}
          });
          row.addEventListener("dragend", function () {
            dragFrom = null;
            row.classList.remove("is-dragging");
            rows.querySelectorAll(".list-row.is-drop-target").forEach(function (r) {
              r.classList.remove("is-drop-target");
            });
          });
          row.addEventListener("dragover", function (e) {
            e.preventDefault();
            try {
              e.dataTransfer.dropEffect = "move";
            } catch (err) {}
            if (dragFrom === null || dragFrom === i) return;
            rows.querySelectorAll(".list-row.is-drop-target").forEach(function (r) {
              r.classList.remove("is-drop-target");
            });
            row.classList.add("is-drop-target");
          });
          row.addEventListener("dragleave", function () {
            row.classList.remove("is-drop-target");
          });
          row.addEventListener("drop", function (e) {
            e.preventDefault();
            row.classList.remove("is-drop-target");
            var from = dragFrom;
            if (from === null) {
              try {
                from = parseInt(e.dataTransfer.getData("text/plain"), 10);
              } catch (err) {
                from = NaN;
              }
            }
            if (isNaN(from) || from === i) return;
            moveItem(from, i);
          });
        }

        rows.appendChild(row);
      });
    }

    if (canReorder) {
      reorderHint = el("p", {
        class: "muted list-reorder-hint",
        text: "Drag rows (or use ↑ ↓) to change order. Save when done.",
      });
      reorderHint.hidden = arr.length < 2;
      container.appendChild(reorderHint);
    }

    var add = el("button", {
      type: "button",
      class: "btn-outline",
      text: "+ Add " + (itemLabel || "item"),
    });
    add.style.marginTop = "0.75rem";
    add.addEventListener("click", function () {
      arr.push(blankListItem(itemDef));
      rebuild();
      openItem(arr.length - 1, true);
    });

    rebuild();
    container.appendChild(rows);
    container.appendChild(add);
    return container;
  }

  /** Collapsible admin field group. Returns { details, body }. */
  function makeAdminFieldGroup(title, open) {
    var details = el("details", { class: "admin-field-group" });
    if (open) details.open = true;
    var sum = el("summary", { class: "admin-field-group-sum" });
    sum.appendChild(el("span", { class: "admin-field-group-title", text: title || "Section" }));
    sum.appendChild(el("span", { class: "admin-field-group-chevron", "aria-hidden": "true" }));
    details.appendChild(sum);
    var body = el("div", { class: "admin-field-group-body" });
    details.appendChild(body);
    return { details: details, body: body };
  }

  /** Render fields; optional field.group → collapsible admin-field-group cards. */
  function appendSectionFields(data, fields, mount) {
    var currentGroup = null;
    var groupBody = mount;
    (fields || []).forEach(function (f) {
      var g = f.group ? String(f.group) : "";
      if (g !== currentGroup) {
        currentGroup = g;
        if (g) {
          var card = makeAdminFieldGroup(g, !!f.groupOpen);
          groupBody = card.body;
          mount.appendChild(card.details);
        } else {
          groupBody = mount;
        }
      }
      groupBody.appendChild(fieldEditor(data, f));
    });
  }

  function renderSectionBody(section, mount) {
    if (section.root === "array") {
      if (!Array.isArray(content[section.key])) content[section.key] = [];
      mount.appendChild(
        listEditor(
          content[section.key],
          section.itemFields,
          section.itemLabel,
          listEditorOptions(section),
        ),
      );
      return;
    }
    if (section.type === "teamRoster") {
      if (!content.team) content.team = {};
      mount.appendChild(teamRosterEditor(content.team));
      return;
    }
    if (section.type === "galleryYears") {
      if (!content.gallery) content.gallery = {};
      mount.appendChild(galleryYearsEditor(content.gallery));
      return;
    }

    if (!content[section.key]) content[section.key] = {};
    var data = content[section.key];
    appendSectionFields(data, section.fields || [], mount);
    (section.lists || []).forEach(function (list) {
      var listHost = mount;
      var listCard = makeAdminFieldGroup(list.label || "Items", !!list.groupOpen);
      listHost = listCard.body;
      mount.appendChild(listCard.details);
      if (!Array.isArray(data[list.key])) data[list.key] = [];
      if (list.key === "galleryImages") {
        data.galleryImages = data.galleryImages.map(function (item) {
          if (typeof item === "string") return { image: item, link: "", name: "" };
          if (!item || typeof item !== "object") return { image: "", link: "", name: "" };
          return {
            image: item.image || "",
            link: item.link || "",
            name: item.name || item.title || item.caption || "",
          };
        });
      }
      if (list.key === "sponsorsImages") {
        if ((!data.sponsorsImages || !data.sponsorsImages.length) && data.sponsorsImage) {
          data.sponsorsImages = [{ image: data.sponsorsImage, link: "", name: "" }];
        }
        data.sponsorsImages = (data.sponsorsImages || []).map(function (item) {
          if (typeof item === "string") return { image: item, link: "", name: "" };
          if (!item || typeof item !== "object") return { image: "", link: "", name: "" };
          return { image: item.image || "", link: item.link || "", name: item.name || "" };
        });
      }
      if (list.key === "showcaseImages") {
        if ((!data.showcaseImages || !data.showcaseImages.length) && data.showcaseImage) {
          data.showcaseImages = [{ image: data.showcaseImage, link: "", name: "" }];
        }
        data.showcaseImages = (data.showcaseImages || []).map(function (item) {
          if (typeof item === "string") return { image: item, link: "", name: "" };
          if (!item || typeof item !== "object") return { image: "", link: "", name: "" };
          return { image: item.image || "", link: item.link || "", name: item.name || "" };
        });
      }
      if (list.key === "years" && section.key === "gallery") {
        // Migrate legacy flat gallery → years[]
        if ((!data.years || !data.years.length) && (data.year || data.videoUrl || (data.categories && data.categories.length))) {
          data.years = [
            {
              id: "2025-2026",
              label: data.year || "2025 - 2026",
              videoUrl: data.videoUrl || "",
              videoImage: data.videoImage || "",
              categories: data.categories || [],
            },
          ];
          if (!data.activeYearId) data.activeYearId = "2025-2026";
        }
        data.years = (data.years || []).map(function (y) {
          if (!y || typeof y !== "object") {
            return { id: "", label: "", videoUrl: "", videoImage: "", categories: [] };
          }
          var cats = Array.isArray(y.categories) ? y.categories : [];
          cats = cats.map(function (cat) {
            if (!cat || typeof cat !== "object") return { name: "", image: "", images: [] };
            var album = Array.isArray(cat.images) ? cat.images : [];
            album = album
              .map(function (item) {
                if (typeof item === "string") return { image: item };
                if (!item || typeof item !== "object") return { image: "" };
                return { image: item.image || "" };
              })
              .filter(function (item) {
                return item.image;
              });
            return {
              name: cat.name || "",
              image: cat.image || "",
              images: album,
            };
          });
          return {
            id: y.id || "",
            label: y.label || y.id || "",
            videoUrl: y.videoUrl || "",
            videoImage: y.videoImage || "",
            categories: cats,
          };
        });
      }
      if (list.key === "categories" && section.key === "gallery") {
        if (!data.videoUrl) data.videoUrl = "";
        data.categories = (data.categories || []).map(function (cat) {
          if (!cat || typeof cat !== "object") {
            return { name: "", image: "", images: [] };
          }
          var album = Array.isArray(cat.images) ? cat.images : [];
          album = album
            .map(function (item) {
              if (typeof item === "string") return { image: item };
              if (!item || typeof item !== "object") return { image: "" };
              return { image: item.image || "" };
            })
            .filter(function (item) {
              return item.image;
            });
          return {
            name: cat.name || "",
            image: cat.image || "",
            images: album,
          };
        });
      }
      listHost.appendChild(
        listEditor(data[list.key], list.item, list.itemLabel, listEditorOptions(list)),
      );
    });
  }

  var faqInboxCount = 0;
  var messagesCount = 0;
  var unsubPendingCount = 0;
  var mailUnreadCount = 0;

  function refreshAttentionStrip() {
    var host = document.getElementById("admin-attention-host");
    if (!host) return;
    var chips = [];
    function add(pageId, label, count, tone) {
      if (!count || count <= 0) return;
      if (pageId !== "publish" && !userCan(pageId) && !(pageId === "users" && ADMIN_USER.isRoot)) return;
      if (pageId === "publish" && !(userCan("publish") || userCan("backup") || userCan("site"))) return;
      chips.push({ pageId: pageId, label: label, count: count, tone: tone || "" });
    }
    add("faq-inbox", "FAQ questions", faqInboxCount, "orange");
    add("messages", "Messages", messagesCount, "");
    add("subscribers", "Unsubscribe requests", unsubPendingCount, "");
    add("mail", "Unread mail", mailUnreadCount, "");
    var pending = Array.isArray(window.PUBLISH_PENDING) ? window.PUBLISH_PENDING.length : 0;
    add("publish", "Scheduled publishes", pending, "");

    var health = window.SITE_HEALTH || {};
    if (ADMIN_USER.isRoot) {
      if (health.errorCount > 0) {
        chips.push({
          pageId: "dashboard",
          label: "Site errors logged",
          count: health.errorCount,
          tone: "orange",
        });
      }
    }

    host.innerHTML = "";
    if (!chips.length) {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    var bar = el("div", { class: "admin-attention", role: "status" });
    bar.appendChild(el("span", { class: "admin-attention-label", text: "Needs attention" }));
    var list = el("div", { class: "admin-attention-chips" });
    chips.forEach(function (chip) {
      var btn = el("button", {
        type: "button",
        class: "admin-attention-chip" + (chip.tone ? " is-" + chip.tone : ""),
        text: chip.label + " · " + chip.count,
      });
      btn.addEventListener("click", function () {
        if (chip.href) {
          window.location.href = chip.href;
          return;
        }
        setActivePage(chip.pageId);
      });
      list.appendChild(btn);
    });
    bar.appendChild(list);
    host.appendChild(bar);
  }

  function formatMailBadgeCount(n) {
    n = Math.max(0, Number(n) || 0);
    if (n > 99) return "99+";
    return String(n);
  }

  function setMailUnreadCount(n) {
    mailUnreadCount = Math.max(0, Number(n) || 0);
    var nav = document.getElementById("admin-nav");
    if (!nav) return;
    var btn = nav.querySelector('[data-nav="mail"]');
    if (!btn) {
      renderNav();
      refreshAttentionStrip();
      return;
    }
    var badge = btn.querySelector(".admin-nav-badge");
    if (mailUnreadCount <= 0) {
      if (badge) badge.remove();
      refreshAttentionStrip();
      return;
    }
    var text = formatMailBadgeCount(mailUnreadCount);
    var digits = String(text.length);
    if (!badge) {
      badge = el("span", { class: "admin-nav-badge", text: text });
      badge.setAttribute("data-digits", "1");
      badge.setAttribute("aria-label", mailUnreadCount + " unread");
      btn.appendChild(badge);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (badge.isConnected) badge.setAttribute("data-digits", digits);
        });
      });
      refreshAttentionStrip();
      return;
    }
    badge.textContent = text;
    badge.setAttribute("aria-label", mailUnreadCount + " unread");
    badge.setAttribute("data-digits", digits);
    refreshAttentionStrip();
  }

  function refreshMailNavBadge() {
    if (!userCan("mail")) return Promise.resolve();
    return mailRequest("GET", "?action=status")
      .then(function (data) {
        setMailUnreadCount(data.unreadCount || 0);
      })
      .catch(function () {});
  }

  function messagesRequest(method, body) {
    var opts = {
      method: method,
      headers: { "X-CSRF-Token": window.CSRF_TOKEN },
    };
    if (body) {
      opts.headers["content-type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch("messages.php", opts).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok || !data || !data.ok) {
          throw new Error((data && data.error) || "Request failed");
        }
        return data;
      });
    });
  }

  function blockedIpsRequest(method, body) {
    var opts = {
      method: method,
      headers: { "X-CSRF-Token": window.CSRF_TOKEN },
    };
    if (body) {
      opts.headers["content-type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch("blocked-ips.php", opts).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok || !data || !data.ok) {
          throw new Error((data && data.error) || "Request failed");
        }
        return data;
      });
    });
  }

  function messagesEditor(mount) {
    var wrap = el("div", { class: "admin-block" });
    wrap.appendChild(el("h2", { class: "admin-block-title", text: "Inbox" }));
    var toolbar = el("div", { class: "imgctl-actions" });
    var clearAll = el("button", { type: "button", class: "link-danger", text: "Clear all" });
    toolbar.appendChild(clearAll);
    wrap.appendChild(toolbar);
    var status = el("p", { class: "muted", text: "Loading…" });
    var list = el("div", { class: "faq-inbox-list" });
    wrap.appendChild(status);
    wrap.appendChild(list);
    mount.appendChild(wrap);

    function sourceLabel(item) {
      if (item.source) return String(item.source);
      if (item.type === "security") return "Security alert";
      return "Construction form";
    }

    function paint(items) {
      list.innerHTML = "";
      messagesCount = items.length;
      renderNav();
      clearAll.hidden = !items.length;
      if (!items.length) {
        status.textContent = "No messages yet.";
        status.className = "muted";
        return;
      }
      status.textContent = items.length + " message" + (items.length === 1 ? "" : "s");
      status.className = "faq-inbox-status has-items";
      items.forEach(function (item) {
        var isSecurity = item.type === "security";
        var card = el("div", {
          class: "faq-inbox-card" + (isSecurity ? " msg-card-security" : ""),
        });
        var source = el("p", {
          class: "msg-source" + (isSecurity ? " is-security" : ""),
          text: sourceLabel(item),
        });
        card.appendChild(source);
        var meta = el("div", { class: "faq-inbox-meta" });
        meta.appendChild(el("span", { text: formatInboxDate(item.createdAt) }));
        if (item.ip) meta.appendChild(el("span", { text: "IP " + item.ip }));
        var who = [];
        if (item.name) who.push(item.name);
        if (item.email) who.push(item.email);
        if (who.length) meta.appendChild(el("span", { text: who.join(" · ") }));
        card.appendChild(meta);
        card.appendChild(el("p", { class: "construction-msg-body", text: item.message || "" }));
        var actions = el("div", { class: "faq-inbox-actions" });
        if (item.ip) {
          var blockBtn = el("button", { type: "button", class: "btn-ghost", text: "Block IP" });
          blockBtn.addEventListener("click", function () {
            var name = prompt("Optional label for this IP (e.g. school lab):", "") || "";
            messagesRequest("POST", {
              action: "block_ip",
              ip: item.ip,
              name: name,
              reason: "Blocked from Messages",
              expiresIn: 86400,
            })
              .then(function () {
                alert("Blocked " + item.ip + " for 24 hours. Adjust in Blocked IPs.");
              })
              .catch(function (e) {
                alert(e.message || "Could not block IP.");
              });
          });
          actions.appendChild(blockBtn);
        }
        var del = el("button", { type: "button", class: "link-danger", text: "Delete" });
        del.addEventListener("click", function () {
          if (!confirm("Delete this message?")) return;
          messagesRequest("POST", { action: "delete", id: item.id })
            .then(function (data) {
              paint(data.items || []);
            })
            .catch(function (e) {
              alert(e.message || "Could not delete.");
            });
        });
        actions.appendChild(del);
        card.appendChild(actions);
        list.appendChild(card);
      });
    }

    clearAll.addEventListener("click", function () {
      if (!confirm("Delete all messages?")) return;
      messagesRequest("POST", { action: "delete_all" })
        .then(function (data) {
          paint(data.items || []);
        })
        .catch(function (e) {
          alert(e.message || "Could not clear.");
        });
    });

    messagesRequest("GET")
      .then(function (data) {
        paint(data.items || []);
      })
      .catch(function (e) {
        status.className = "error";
        status.textContent = e.message || "Could not load messages.";
      });
  }

  function toDatetimeLocalValue(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  function datetimeLocalToIso(value) {
    if (!value) return null;
    var d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  function formatRemainingTime(item) {
    if (!item.expiresAt) return "Never expires";
    var ts = Date.parse(item.expiresAt);
    if (!ts) return "";
    var ms = ts - Date.now();
    if (ms <= 0) return "Expired";
    var s = Math.floor(ms / 1000);
    var days = Math.floor(s / 86400);
    s %= 86400;
    var hours = Math.floor(s / 3600);
    s %= 3600;
    var mins = Math.floor(s / 60);
    if (days > 0) return days + "d " + hours + "h left";
    if (hours > 0) return hours + "h " + mins + "m left";
    if (mins > 0) return mins + "m left";
    return "<1m left";
  }

  function blockedIpStatusLabel(item) {
    if (!item.active) return "Expired";
    if (!item.expiresAt || item.permanent) return "Permanent";
    return "Active";
  }

  function blockedIpsEditor(mount) {
    var wrap = el("div", { class: "admin-block blocked-ips-block" });
    wrap.appendChild(el("h2", { class: "admin-block-title", text: "Blocked IPs" }));
    wrap.appendChild(
      el("p", {
        class: "section-desc",
        text:
          "Full blocks: auto after construction spam or failed logins, or added manually. Unsubscribe cooldowns (soft locks) appear in their own section when an IP hits 5 unsubscribe attempts in 12 hours — Unblock clears that cooldown immediately. A Messages alert is posted when a cooldown starts.",
      }),
    );

    var addBlock = el("div", { class: "users-create blocked-ips-create" });
    addBlock.appendChild(el("h3", { class: "users-create-title", text: "Block an IP" }));
    var ipField = el("div", { class: "users-field" });
    ipField.appendChild(el("label", { text: "IP address" }));
    var newIp = el("input", {
      type: "text",
      placeholder: "e.g. 203.0.113.10",
      autocomplete: "off",
      spellcheck: "false",
    });
    ipField.appendChild(newIp);
    var nameField = el("div", { class: "users-field" });
    nameField.appendChild(el("label", { text: "Name / label (optional)" }));
    var newName = el("input", { type: "text", placeholder: "e.g. Campus lab", autocomplete: "off" });
    nameField.appendChild(newName);
    var noteField = el("div", { class: "users-field" });
    noteField.appendChild(el("label", { text: "Note (optional)" }));
    var newNote = el("input", { type: "text", placeholder: "Why blocked", autocomplete: "off" });
    noteField.appendChild(newNote);

    var durField = el("div", { class: "users-field" });
    durField.appendChild(el("label", { text: "Duration" }));
    var newDur = el("select");
    [
      { v: "3600", t: "1 hour" },
      { v: "86400", t: "24 hours" },
      { v: "604800", t: "7 days" },
      { v: "0", t: "Permanent" },
      { v: "custom", t: "Custom date & time…" },
    ].forEach(function (o) {
      var opt = el("option", { value: o.v, text: o.t });
      if (o.v === "86400") opt.selected = true;
      newDur.appendChild(opt);
    });
    durField.appendChild(newDur);

    var customExpiryField = el("div", { class: "users-field blocked-ips-custom-expiry is-hidden" });
    customExpiryField.appendChild(el("label", { text: "Expires at (your local time)" }));
    var newCustomExpiry = el("input", { type: "datetime-local" });
    customExpiryField.appendChild(newCustomExpiry);

    newDur.addEventListener("change", function () {
      if (newDur.value === "custom") {
        customExpiryField.classList.remove("is-hidden");
        if (!newCustomExpiry.value) {
          var soon = new Date(Date.now() + 86400000);
          newCustomExpiry.value = toDatetimeLocalValue(soon.toISOString());
        }
      } else {
        customExpiryField.classList.add("is-hidden");
      }
    });

    var addBtn = el("button", { type: "button", class: "btn btn-orange sm", text: "Block IP" });
    addBlock.appendChild(ipField);
    addBlock.appendChild(nameField);
    addBlock.appendChild(noteField);
    addBlock.appendChild(durField);
    addBlock.appendChild(customExpiryField);
    addBlock.appendChild(addBtn);

    var toolbar = el("div", { class: "blocked-ips-toolbar" });
    var search = el("input", {
      type: "search",
      class: "blocked-ips-search",
      placeholder: "Filter by IP, name, or note…",
      autocomplete: "off",
    });
    var clearExpiredBtn = el("button", {
      type: "button",
      class: "btn-ghost",
      text: "Remove expired",
    });
    toolbar.appendChild(search);
    toolbar.appendChild(clearExpiredBtn);

    var tzNote = el("p", {
      class: "muted blocked-ips-tz",
      text: "Expiry times use your browser’s local timezone and are stored as absolute timestamps.",
    });
    var status = el("p", { class: "muted faq-inbox-status", text: "Loading…" });

    var blocksHeading = el("h3", { class: "blocked-ips-section-title", text: "Site blocks" });
    var list = el("div", { class: "blocked-ips-list list-rows" });
    var empty = el("div", { class: "blocked-ips-empty is-hidden" });
    empty.appendChild(el("p", { class: "blocked-ips-empty-title", text: "No site blocks" }));
    empty.appendChild(
      el("p", {
        class: "muted",
        text: "Addresses appear here when blocked manually or by rate limits / failed logins.",
      }),
    );

    var cooldownHeading = el("h3", {
      class: "blocked-ips-section-title",
      text: "Unsubscribe cooldowns",
    });
    var cooldownDesc = el("p", {
      class: "muted blocked-ips-section-desc",
      text: "Soft locks only — visitors can still browse the site. Unblock clears the 12-hour unsubscribe rate bucket.",
    });
    var cooldownList = el("div", { class: "blocked-ips-list list-rows blocked-ips-cooldown-list" });
    var cooldownEmpty = el("div", { class: "blocked-ips-empty is-hidden" });
    cooldownEmpty.appendChild(
      el("p", { class: "blocked-ips-empty-title", text: "No unsubscribe cooldowns" }),
    );
    cooldownEmpty.appendChild(
      el("p", {
        class: "muted",
        text: "IPs that hit 5 unsubscribe attempts in 12 hours show up here and also post a Messages alert.",
      }),
    );

    wrap.appendChild(addBlock);
    wrap.appendChild(tzNote);
    wrap.appendChild(toolbar);
    wrap.appendChild(status);
    wrap.appendChild(blocksHeading);
    wrap.appendChild(empty);
    wrap.appendChild(list);
    wrap.appendChild(cooldownHeading);
    wrap.appendChild(cooldownDesc);
    wrap.appendChild(cooldownEmpty);
    wrap.appendChild(cooldownList);
    mount.appendChild(wrap);

    var allItems = [];
    var expandedIp = null;
    var serverTzLabel = "";

    function isUnsubCooldown(item) {
      return String((item && item.source) || "") === "unsub_cooldown";
    }

    function sourceLabel(item) {
      if (isUnsubCooldown(item)) return "Unsub cooldown";
      if (item.source === "auto") return "Auto";
      return "Manual";
    }

    function expirySummary(item) {
      if (!item.expiresAt) return "Permanent";
      var ts = Date.parse(item.expiresAt);
      if (!ts) return String(item.expiresAt);
      if (ts <= Date.now()) return "Expired " + formatInboxDate(item.expiresAt);
      return formatRemainingTime(item) + " · " + formatInboxDate(item.expiresAt);
    }

    function filteredItems(pool) {
      var q = (search.value || "").trim().toLowerCase();
      var base = Array.isArray(pool) ? pool : [];
      if (!q) return base.slice();
      return base.filter(function (item) {
        var hay = [item.ip, item.name, item.note, item.reason, item.source]
          .map(function (v) {
            return String(v || "").toLowerCase();
          })
          .join(" ");
        return hay.indexOf(q) !== -1;
      });
    }

    function setItems(items) {
      allItems = Array.isArray(items) ? items.slice() : [];
      paint();
    }

    function paintRow(item, targetList) {
      var isOpen = expandedIp === item.ip;
      var row = el("div", {
        class:
          "list-row blocked-ip-row" +
          (isOpen ? " is-expanded" : " is-collapsed") +
          (item.active ? "" : " is-expired") +
          (isUnsubCooldown(item) ? " is-unsub-cooldown" : ""),
      });

      var bar = el("div", {
        class: "list-row-bar",
        role: "button",
        tabindex: "0",
        "aria-expanded": isOpen ? "true" : "false",
      });
      var left = el("div", { class: "list-row-bar-left" });
      var textCol = el("div", { class: "list-row-text" });
      var title = item.name ? item.ip + " · " + item.name : item.ip;
      textCol.appendChild(el("span", { class: "list-row-summary", text: title }));
      textCol.appendChild(
        el("span", {
          class: "list-row-date",
          text: sourceLabel(item) + " · " + expirySummary(item),
        }),
      );
      left.appendChild(textCol);

      var actions = el("div", { class: "list-row-bar-actions" });
      var badge = el("span", {
        class:
          "blocked-ip-badge" +
          (item.active ? (item.expiresAt ? " is-active" : " is-permanent") : " is-expired"),
        text: blockedIpStatusLabel(item),
      });
      var chevron = el("span", {
        class: "blocked-ip-chevron",
        text: isOpen ? "▾" : "▸",
        "aria-hidden": "true",
      });
      actions.appendChild(badge);
      actions.appendChild(chevron);
      bar.appendChild(left);
      bar.appendChild(actions);

      function toggle() {
        expandedIp = isOpen ? null : item.ip;
        paint();
      }
      bar.addEventListener("click", toggle);
      bar.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
      row.appendChild(bar);

      if (isOpen) {
        var body = el("div", { class: "blocked-ip-details" });
        var meta = el("div", { class: "faq-inbox-meta" });
        if (item.blockedAt) {
          meta.appendChild(el("span", { text: "Since " + formatInboxDate(item.blockedAt) }));
        }
        if (item.reason) meta.appendChild(el("span", { text: item.reason }));
        if (item.expiresAt) {
          meta.appendChild(el("span", { text: "Expires " + formatInboxDate(item.expiresAt) }));
          var rem = formatRemainingTime(item);
          if (rem) meta.appendChild(el("span", { text: rem }));
        } else {
          meta.appendChild(el("span", { text: "Never expires" }));
        }
        body.appendChild(meta);

        var nameIn = el("input", { type: "text", placeholder: "Name / label" });
        nameIn.value = item.name || "";
        var noteIn = el("input", { type: "text", placeholder: "Note" });
        noteIn.value = item.note || "";

        var modeField = el("div", { class: "users-field" });
        modeField.appendChild(el("label", { text: "Expiry" }));
        var mode = el("select");
        [
          { v: "keep", t: "Keep current expiry" },
          { v: "custom", t: "Set date & time…" },
          { v: "3600", t: "Extend 1 hour from now" },
          { v: "86400", t: "Extend 24 hours from now" },
          { v: "604800", t: "Extend 7 days from now" },
          { v: "0", t: "Make permanent" },
        ].forEach(function (o) {
          mode.appendChild(el("option", { value: o.v, text: o.t }));
        });
        modeField.appendChild(mode);

        var customField = el("div", { class: "users-field blocked-ips-custom-expiry is-hidden" });
        customField.appendChild(el("label", { text: "Expires at (your local time)" }));
        var customIn = el("input", { type: "datetime-local" });
        customIn.value =
          toDatetimeLocalValue(item.expiresAt) ||
          toDatetimeLocalValue(new Date(Date.now() + 86400000).toISOString());
        customField.appendChild(customIn);

        mode.addEventListener("change", function () {
          if (mode.value === "custom") {
            customField.classList.remove("is-hidden");
          } else {
            customField.classList.add("is-hidden");
          }
        });

        body.appendChild(el("label", { text: "Name" }));
        body.appendChild(nameIn);
        body.appendChild(el("label", { text: "Note" }));
        body.appendChild(noteIn);
        body.appendChild(modeField);
        body.appendChild(customField);
        if (serverTzLabel) {
          body.appendChild(
            el("p", {
              class: "muted blocked-ips-detail-tz",
              text: "Server clock: " + serverTzLabel + ". Picker uses your local time.",
            }),
          );
        }

        var rowActions = el("div", { class: "faq-inbox-actions" });
        var save = el("button", { type: "button", class: "btn btn-orange sm", text: "Save" });
        var remove = el("button", {
          type: "button",
          class: "link-danger",
          text: isUnsubCooldown(item) ? "Clear cooldown" : "Unblock",
        });
        save.addEventListener("click", function () {
          var payload = {
            action: "update",
            ip: item.ip,
            name: nameIn.value.trim(),
            note: noteIn.value.trim(),
          };
          if (mode.value === "custom") {
            var iso = datetimeLocalToIso(customIn.value);
            if (!iso) {
              alert("Choose a valid expiration date and time.");
              return;
            }
            payload.expiresAt = iso;
          } else if (mode.value === "0") {
            payload.expiresAt = null;
          } else if (mode.value !== "keep") {
            payload.expiresIn = parseInt(mode.value, 10) || 0;
          }
          save.disabled = true;
          blockedIpsRequest("POST", payload)
            .then(function (data) {
              expandedIp = item.ip;
              setItems(data.items || []);
            })
            .catch(function (e) {
              alert(e.message || "Could not save.");
              save.disabled = false;
            });
        });
        remove.addEventListener("click", function () {
          var msg = isUnsubCooldown(item)
            ? "Clear unsubscribe cooldown for " +
              item.ip +
              "? They can try unsubscribe again immediately."
            : "Unblock " + item.ip + "? They will be able to access the site again immediately.";
          if (!confirm(msg)) {
            return;
          }
          blockedIpsRequest("POST", { action: "remove", ip: item.ip })
            .then(function (data) {
              if (expandedIp === item.ip) expandedIp = null;
              setItems(data.items || []);
            })
            .catch(function (e) {
              alert(e.message || "Could not unblock.");
            });
        });
        rowActions.appendChild(save);
        rowActions.appendChild(remove);
        body.appendChild(rowActions);
        row.appendChild(body);
      }

      targetList.appendChild(row);
    }

    function paint() {
      list.innerHTML = "";
      cooldownList.innerHTML = "";
      var siteItems = allItems.filter(function (i) {
        return !isUnsubCooldown(i);
      });
      var cooldownItems = allItems.filter(isUnsubCooldown);
      var shownSite = filteredItems(siteItems);
      var shownCooldown = filteredItems(cooldownItems);
      var activeCount = allItems.filter(function (i) {
        return i.active;
      }).length;
      var expiredCount = allItems.length - activeCount;
      var activeCooldown = cooldownItems.filter(function (i) {
        return i.active;
      }).length;

      if (!allItems.length) {
        status.textContent = "";
        status.className = "muted faq-inbox-status";
        empty.classList.remove("is-hidden");
        cooldownEmpty.classList.remove("is-hidden");
        clearExpiredBtn.disabled = true;
        return;
      }
      clearExpiredBtn.disabled = expiredCount === 0;

      var parts = [allItems.length + " listed", activeCount + " active"];
      if (activeCooldown) parts.push(activeCooldown + " unsub cooldown");
      if (expiredCount) parts.push(expiredCount + " expired");
      var shownTotal = shownSite.length + shownCooldown.length;
      if ((search.value || "").trim() && shownTotal !== allItems.length) {
        parts.push("showing " + shownTotal);
      }
      status.textContent = parts.join(" · ");
      status.className = "faq-inbox-status has-items";

      if (!siteItems.length) {
        empty.classList.remove("is-hidden");
      } else {
        empty.classList.add("is-hidden");
        if (!shownSite.length) {
          list.appendChild(
            el("p", { class: "muted blocked-ips-no-match", text: "No site blocks match that filter." }),
          );
        } else {
          shownSite.forEach(function (item) {
            paintRow(item, list);
          });
        }
      }

      if (!cooldownItems.length) {
        cooldownEmpty.classList.remove("is-hidden");
      } else {
        cooldownEmpty.classList.add("is-hidden");
        if (!shownCooldown.length) {
          cooldownList.appendChild(
            el("p", {
              class: "muted blocked-ips-no-match",
              text: "No unsubscribe cooldowns match that filter.",
            }),
          );
        } else {
          shownCooldown.forEach(function (item) {
            paintRow(item, cooldownList);
          });
        }
      }
    }

    search.addEventListener("input", paint);

    clearExpiredBtn.addEventListener("click", function () {
      var n = allItems.filter(function (i) {
        return !i.active;
      }).length;
      if (!n) {
        alert("No expired blocks to remove.");
        return;
      }
      if (!confirm("Remove " + n + " expired block" + (n === 1 ? "" : "s") + "? Active blocks are kept.")) {
        return;
      }
      clearExpiredBtn.disabled = true;
      blockedIpsRequest("POST", { action: "clear_expired" })
        .then(function (data) {
          expandedIp = null;
          setItems(data.items || []);
        })
        .catch(function (e) {
          alert(e.message || "Could not clear expired.");
          clearExpiredBtn.disabled = false;
        });
    });

    addBtn.addEventListener("click", function () {
      var ip = (newIp.value || "").trim();
      if (!ip) {
        alert("Enter an IP address.");
        return;
      }
      var existing = allItems.some(function (i) {
        return i.ip === ip;
      });
      if (existing && !confirm(ip + " is already listed. Update the existing block?")) {
        return;
      }
      var payload = {
        action: "add",
        ip: ip,
        name: (newName.value || "").trim(),
        note: (newNote.value || "").trim(),
        reason: "Manually blocked",
      };
      if (newDur.value === "custom") {
        var iso = datetimeLocalToIso(newCustomExpiry.value);
        if (!iso) {
          alert("Choose a valid expiration date and time.");
          return;
        }
        payload.expiresAt = iso;
      } else {
        payload.expiresIn = parseInt(newDur.value, 10) || 0;
      }
      addBtn.disabled = true;
      blockedIpsRequest("POST", payload)
        .then(function (data) {
          newIp.value = "";
          newName.value = "";
          newNote.value = "";
          expandedIp = ip;
          setItems(data.items || []);
        })
        .catch(function (e) {
          alert(e.message || "Could not block IP.");
        })
        .then(function () {
          addBtn.disabled = false;
        });
    });

    blockedIpsRequest("GET")
      .then(function (data) {
        serverTzLabel = data.timezoneLabel || data.timezone || "";
        if (serverTzLabel) {
          tzNote.textContent =
            "Expiry times use your browser’s local timezone (stored as absolute timestamps).";
        }
        setItems(data.items || []);
      })
      .catch(function (e) {
        status.className = "error";
        status.textContent = e.message || "Could not load blocked IPs.";
      });
  }

  function formatBytes(n) {
    n = Math.max(0, Number(n) || 0);
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10 * 1024 ? 1 : 0) + " KB";
    return (n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 1) + " MB";
  }

  function formatRelativeWhen(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    var sec = Math.round((Date.now() - d.getTime()) / 1000);
    if (sec < 0) return formatInboxDate(iso);
    if (sec < 60) return "Just now";
    if (sec < 3600) {
      var m = Math.floor(sec / 60);
      return m + " min ago";
    }
    if (sec < 86400) {
      var h = Math.floor(sec / 3600);
      return h + " hour" + (h === 1 ? "" : "s") + " ago";
    }
    if (sec < 86400 * 7) {
      var days = Math.floor(sec / 86400);
      return days + " day" + (days === 1 ? "" : "s") + " ago";
    }
    return formatInboxDate(iso);
  }

  function dashboardHealthSection() {
    var health = window.SITE_HEALTH || {};
    var errors = Array.isArray(health.errors) ? health.errors : [];

    var section = el("div", { class: "dashboard-section" });
    section.appendChild(el("h3", { class: "dashboard-section-title", text: "Site health" }));

    if (!errors.length) {
      section.appendChild(
        el("p", { class: "muted", text: "No site errors logged. Nothing has crashed recently." }),
      );
      return section;
    }

    section.appendChild(
      el("p", {
        class: "section-desc",
        text:
          "Recent PHP errors on this server, newest first. If these repeat, send this list to whoever maintains the site.",
      }),
    );

    var list = el("div", { class: "dashboard-health-list" });
    errors.forEach(function (entry) {
      var row = el("div", { class: "dashboard-health-row" });
      var head = el("div", { class: "dashboard-health-head" });
      head.appendChild(
        el("strong", { text: formatInboxDate(new Date((entry.at || 0) * 1000).toISOString()) }),
      );
      head.appendChild(el("span", { class: "muted", text: " " + (entry.kind || "error") }));
      if (entry.count > 1) {
        head.appendChild(el("span", { class: "muted", text: " ×" + entry.count }));
      }
      row.appendChild(head);
      row.appendChild(el("p", { class: "dashboard-health-msg", text: entry.message || "" }));
      var where = [];
      if (entry.file) where.push(entry.file + (entry.line ? ":" + entry.line : ""));
      if (entry.path) where.push(entry.path);
      if (where.length) {
        row.appendChild(el("p", { class: "muted dashboard-health-where", text: where.join(" — ") }));
      }
      list.appendChild(row);
    });
    section.appendChild(list);

    var clear = el("button", { type: "button", class: "btn btn-outline", text: "Clear error log" });
    clear.addEventListener("click", function () {
      if (!confirm("Clear the logged site errors? This only clears the list, it does not fix anything.")) {
        return;
      }
      clear.disabled = true;
      fetch("health.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": window.CSRF_TOKEN,
        },
        body: JSON.stringify({ action: "clear" }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          if (!data || !data.ok) throw new Error((data && data.error) || "Could not clear");
          health.errors = [];
          health.errorCount = 0;
          refreshAttentionStrip();
          renderPanel();
        })
        .catch(function (e) {
          clear.disabled = false;
          alert(e.message || "Could not clear the error log.");
        });
    });
    section.appendChild(clear);

    return section;
  }

  function formatUptimeDuration(seconds) {
    seconds = Math.max(0, Math.floor(Number(seconds) || 0));
    if (seconds < 60) return seconds + "s";
    if (seconds < 3600) return Math.round(seconds / 60) + " min";
    if (seconds < 86400) {
      var h = Math.floor(seconds / 3600);
      var m = Math.floor((seconds % 3600) / 60);
      return m > 0 ? h + "h " + m + "m" : h + "h";
    }
    var d = Math.floor(seconds / 86400);
    var hh = Math.floor((seconds % 86400) / 3600);
    return hh > 0 ? d + "d " + hh + "h" : d + "d";
  }

  /** Heartbeat-based host quiet gaps (Admin → Dashboard). */
  function dashboardUptimeSection() {
    var up = window.SITE_UPTIME || {};
    var section = el("div", { class: "dashboard-section" });
    section.appendChild(el("h3", { class: "dashboard-section-title", text: "Server uptime" }));
    section.appendChild(
      el("p", {
        class: "section-desc",
        text:
          "Tracks when this host last handled site traffic. A quiet gap of 2+ hours is logged as a possible outage when traffic returns. Quiet overnight with no visitors is normal — for guaranteed alerts use a free external monitor on /api/health.php.",
      }),
    );

    var tone =
      up.status === "online" ? "ok" : up.status === "stale" ? "warn" : up.status === "quiet" ? "" : "warn";
    var grid = el("div", { class: "dashboard-status-grid" });
    function card(title, value, cardTone, titleAttr) {
      var c = el("div", {
        class: "dashboard-status-card is-static" + (cardTone ? " is-" + cardTone : ""),
      });
      if (titleAttr) c.title = titleAttr;
      c.appendChild(el("span", { class: "dashboard-status-label", text: title }));
      c.appendChild(el("strong", { class: "dashboard-status-value", text: value }));
      grid.appendChild(c);
    }
    card(
      "Status",
      up.status === "online"
        ? "Online"
        : up.status === "quiet"
          ? "Quiet"
          : up.status === "stale"
            ? "Long silence"
            : "Unknown",
      tone,
    );
    card(
      "Up since last gap",
      formatUptimeDuration(up.continuousSeconds || 0),
      "",
      up.firstSeen ? "Tracking since " + formatInboxDate(up.firstSeen) : "",
    );
    card(
      "Last heartbeat",
      up.lastSeen ? formatRelativeWhen(up.lastSeen) : "—",
      "",
      up.lastSeen ? formatInboxDate(up.lastSeen) : "No heartbeat yet",
    );
    section.appendChild(grid);
    section.appendChild(el("p", { class: "muted dashboard-uptime-meta", text: up.statusLabel || "" }));

    var outages = Array.isArray(up.recentOutages) ? up.recentOutages : [];
    if (!outages.length) {
      section.appendChild(
        el("p", {
          class: "muted",
          text: "No long quiet gaps recorded yet. Gaps appear here after the site comes back from 2+ hours of silence.",
        }),
      );
      return section;
    }

    section.appendChild(el("h4", { class: "dashboard-section-title", text: "Recent quiet gaps" }));
    var list = el("div", { class: "dashboard-uptime-list" });
    outages.forEach(function (row) {
      var r = el("div", { class: "dashboard-uptime-row" });
      r.appendChild(el("strong", { text: row.label || "Quiet gap" }));
      r.appendChild(
        el("p", {
          class: "muted",
          text:
            (row.from ? formatInboxDate(row.from) : "?") +
            " → " +
            (row.to ? formatInboxDate(row.to) : "?"),
        }),
      );
      list.appendChild(r);
    });
    section.appendChild(list);
    return section;
  }

  function formatMediaDate(ts) {
    var d = new Date((Number(ts) || 0) * 1000);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function mediaLibraryEditor(mount) {
    var wrap = el("div", { class: "admin-block media-library-block" });
    wrap.appendChild(el("h2", { class: "admin-block-title", text: "Uploaded images" }));
    wrap.appendChild(
      el("p", {
        class: "section-desc",
        text: "Everything in /uploads. Click an image for size, date, and every place it is used in the CMS (plus newsletter drafts and scheduled publishes).",
      }),
    );

    var toolbar = el("div", { class: "media-library-toolbar" });
    var filter = el("input", {
      type: "search",
      class: "media-library-filter",
      placeholder: "Search filename or where it’s used…",
      "aria-label": "Search images by filename or usage",
    });
    var filterSelect = el("select", { class: "media-library-filter-select", "aria-label": "Filter by usage" });
    [
      { v: "all", t: "All images" },
      { v: "used", t: "In use" },
      { v: "unused", t: "Unused" },
    ].forEach(function (opt) {
      filterSelect.appendChild(el("option", { value: opt.v, text: opt.t }));
    });
    var refreshBtn = el("button", { type: "button", class: "btn-ghost", text: "Refresh" });
    toolbar.appendChild(filter);
    toolbar.appendChild(filterSelect);
    toolbar.appendChild(refreshBtn);
    wrap.appendChild(toolbar);

    var summary = el("p", { class: "muted media-library-summary", text: "Loading…" });
    var status = el("p", { class: "muted media-library-status", text: "" });
    var grid = el("div", { class: "media-library-grid", role: "list" });
    wrap.appendChild(summary);
    wrap.appendChild(status);
    wrap.appendChild(grid);
    mount.appendChild(wrap);

    var items = [];

    function openMediaDetail(item) {
      var body = el("div", { class: "media-detail" });
      var preview = el("img", {
        class: "media-detail-preview",
        src: previewSrc(item.url),
        alt: item.name || "Upload",
      });
      body.appendChild(preview);

      var meta = el("dl", { class: "media-detail-meta" });
      function addMeta(label, value) {
        meta.appendChild(el("dt", { text: label }));
        meta.appendChild(el("dd", { text: value }));
      }
      addMeta("File", item.name || "—");
      addMeta("Path", item.url || "—");
      addMeta("Size", formatBytes(item.size));
      addMeta("Uploaded", formatMediaDate(item.mtime));
      addMeta("Used in", String(item.usageCount || 0) + " place" + ((item.usageCount || 0) === 1 ? "" : "s"));
      body.appendChild(meta);

      var renameBox = el("div", { class: "media-rename-box field" });
      renameBox.appendChild(el("label", { text: "Filename", for: "media-rename-input" }));
      var renameInput = el("input", {
        type: "text",
        id: "media-rename-input",
        class: "media-rename-input",
        value: item.name || "",
        spellcheck: "false",
        autocomplete: "off",
      });
      renameBox.appendChild(renameInput);
      renameBox.appendChild(
        el("p", {
          class: "muted media-rename-hint",
          text: "Letters, numbers, dots, dashes. Extension stays the same. All CMS / draft / schedule references update automatically.",
        }),
      );
      body.appendChild(renameBox);

      var copyRow = el("div", { class: "media-detail-actions" });
      var renameBtn = el("button", { type: "button", class: "btn btn-orange sm", text: "Rename" });
      var copyBtn = el("button", { type: "button", class: "btn-outline", text: "Copy path" });
      var deleteBtn = el("button", {
        type: "button",
        class: "link-danger",
        text: "Delete permanently",
      });
      renameBtn.addEventListener("click", function () {
        var oldName = item.name || "";
        var nextName = (renameInput.value || "").trim();
        if (!oldName) return;
        if (!nextName) {
          alert("Enter a new filename.");
          return;
        }
        if (nextName === oldName) {
          status.className = "muted media-library-status";
          status.textContent = "Filename unchanged.";
          return;
        }
        var uses = Number(item.usageCount) || 0;
        var msg =
          'Rename "' +
          oldName +
          '" to "' +
          nextName +
          '"?';
        if (uses > 0) {
          msg +=
            "\n\nThis will update " +
            uses +
            " reference" +
            (uses === 1 ? "" : "s") +
            " in live content, newsletter drafts, and scheduled publishes.";
        }
        if (!confirm(msg)) return;
        renameBtn.disabled = true;
        copyBtn.disabled = true;
        deleteBtn.disabled = true;
        fetch("media.php", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            "X-CSRF-Token": window.CSRF_TOKEN || "",
          },
          body: JSON.stringify({
            action: "rename",
            name: oldName,
            newName: nextName,
            csrf: window.CSRF_TOKEN || "",
          }),
        })
          .then(function (r) {
            return r.json().then(function (data) {
              if (!r.ok || !data || !data.ok) {
                throw new Error((data && data.error) || "Could not rename.");
              }
              return data;
            });
          })
          .then(function (data) {
            var sheet = document.querySelector(".admin-sheet.is-open");
            if (sheet) {
              sheet.setAttribute("data-closing", "1");
              sheet.classList.remove("is-open");
              if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
              document.body.classList.remove("admin-sheet-lock");
            }
            status.className = "save-status ok media-library-status";
            status.textContent =
              'Renamed to "' +
              (data.name || nextName) +
              '"' +
              (data.rewritten
                ? " · updated " + data.rewritten + " reference" + (data.rewritten === 1 ? "" : "s")
                : "") +
              ".";
            // Keep in-memory CMS content in sync for the rest of this session.
            if (typeof content === "object" && content && data.oldName && data.name) {
              (function rewriteLocal(node, oldN, newUrl) {
                if (typeof node === "string") {
                  if (node === "uploads/" + oldN || node === oldN) return newUrl;
                  if (node.slice(-("/" + oldN).length) === "/" + oldN && /uploads\//i.test(node)) {
                    return node.replace(new RegExp(oldN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"), data.name);
                  }
                  return node;
                }
                if (!node || typeof node !== "object") return node;
                if (Array.isArray(node)) {
                  for (var i = 0; i < node.length; i++) node[i] = rewriteLocal(node[i], oldN, newUrl);
                  return node;
                }
                Object.keys(node).forEach(function (k) {
                  node[k] = rewriteLocal(node[k], oldN, newUrl);
                });
                return node;
              })(content, data.oldName, data.url || "uploads/" + data.name);
            }
            load();
          })
          .catch(function (err) {
            renameBtn.disabled = false;
            copyBtn.disabled = false;
            deleteBtn.disabled = false;
            alert((err && err.message) || "Could not rename.");
          });
      });
      copyBtn.addEventListener("click", function () {
        var path = item.url || "";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(path).then(
            function () {
              copyBtn.textContent = "Copied";
              setTimeout(function () {
                copyBtn.textContent = "Copy path";
              }, 1200);
            },
            function () {
              window.prompt("Copy this path:", path);
            },
          );
        } else {
          window.prompt("Copy this path:", path);
        }
      });
      deleteBtn.addEventListener("click", function () {
        var name = item.name || "";
        if (!name) return;
        var uses = Number(item.usageCount) || 0;
        var msg =
          "Permanently delete this image from the server?\n\n" +
          name +
          "\n\nThis cannot be undone.";
        if (uses > 0) {
          msg =
            "This image is still used in " +
            uses +
            " place" +
            (uses === 1 ? "" : "s") +
            " (CMS / newsletter draft / scheduled publish).\n\n" +
            "Deleting it will break those spots until you replace the image.\n\n" +
            "Delete " +
            name +
            " permanently?";
          if (!confirm(msg)) return;
          if (
            !confirm(
              "Final confirmation: permanently delete this in-use file from /uploads?\n\n" + name,
            )
          ) {
            return;
          }
        } else if (!confirm(msg)) {
          return;
        }
        deleteBtn.disabled = true;
        copyBtn.disabled = true;
        renameBtn.disabled = true;
        fetch("media.php", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            "X-CSRF-Token": window.CSRF_TOKEN || "",
          },
          body: JSON.stringify({
            action: "delete",
            name: name,
            csrf: window.CSRF_TOKEN || "",
          }),
        })
          .then(function (r) {
            return r.json().then(function (data) {
              if (!r.ok || !data || !data.ok) {
                throw new Error((data && data.error) || "Could not delete.");
              }
              return data;
            });
          })
          .then(function () {
            var sheet = document.querySelector(".admin-sheet.is-open");
            if (sheet) {
              sheet.setAttribute("data-closing", "1");
              sheet.classList.remove("is-open");
              if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
              document.body.classList.remove("admin-sheet-lock");
            }
            status.className = "save-status ok media-library-status";
            status.textContent = "Deleted " + name + ".";
            load();
          })
          .catch(function (err) {
            deleteBtn.disabled = false;
            copyBtn.disabled = false;
            renameBtn.disabled = false;
            alert((err && err.message) || "Could not delete.");
          });
      });
      copyRow.appendChild(renameBtn);
      copyRow.appendChild(copyBtn);
      copyRow.appendChild(deleteBtn);
      body.appendChild(copyRow);

      body.appendChild(el("h3", { class: "media-detail-subhead", text: "Where it’s used" }));
      var usages = Array.isArray(item.usages) ? item.usages : [];
      if (!usages.length) {
        body.appendChild(
          el("p", {
            class: "muted",
            text: "Not referenced in live content, newsletter drafts, or scheduled publishes. Safe to leave, or replace from the page that used to use it.",
          }),
        );
      } else {
        var list = el("ul", { class: "media-usage-list" });
        usages.forEach(function (u) {
          var li = el("li", { class: "media-usage-item" });
          var main = el("div", { class: "media-usage-main" });
          main.appendChild(el("strong", { text: u.label || u.path || "Content" }));
          if (u.path) {
            main.appendChild(el("span", { class: "muted media-usage-path", text: u.path }));
          }
          if (u.source && u.source !== "content") {
            main.appendChild(
              el("span", {
                class: "media-usage-source",
                text: u.source === "newsletter-draft" ? "Newsletter draft" : "Scheduled publish",
              }),
            );
          }
          li.appendChild(main);
          if (u.page) {
            var go = el("button", {
              type: "button",
              class: "btn-outline",
              text: "Open tab",
            });
            go.addEventListener("click", function () {
              var sheet = document.querySelector(".admin-sheet.is-open");
              if (sheet) {
                sheet.setAttribute("data-closing", "1");
                sheet.classList.remove("is-open");
                if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
                document.body.classList.remove("admin-sheet-lock");
              }
              setActivePage(u.page);
            });
            li.appendChild(go);
          }
          list.appendChild(li);
        });
        body.appendChild(list);
      }

      openAdminInfoSheet(item.name || "Image details", body);
    }

    function paint() {
      grid.innerHTML = "";
      var q = (filter.value || "").trim().toLowerCase();
      var mode = filterSelect.value || "all";
      var shown = items.filter(function (item) {
        if (mode === "used" && !(item.usageCount > 0)) return false;
        if (mode === "unused" && item.usageCount > 0) return false;
        if (!q) return true;
        if (String(item.name || "").toLowerCase().indexOf(q) !== -1) return true;
        var usages = Array.isArray(item.usages) ? item.usages : [];
        for (var ui = 0; ui < usages.length; ui++) {
          var u = usages[ui] || {};
          var hay =
            String(u.label || "") +
            " " +
            String(u.path || "") +
            " " +
            String(u.source || "") +
            " " +
            String(u.page || "");
          if (hay.toLowerCase().indexOf(q) !== -1) return true;
        }
        return false;
      });

      if (!items.length) {
        status.textContent = "No images in /uploads yet. Upload from any page image control.";
        status.className = "muted media-library-status";
        return;
      }
      if (!shown.length) {
        status.textContent = "No images match this filter.";
        status.className = "muted media-library-status";
        return;
      }
      status.textContent = "";
      shown.forEach(function (item) {
        var btn = el("button", {
          type: "button",
          class: "media-library-card" + (item.usageCount > 0 ? " is-used" : " is-unused"),
          role: "listitem",
          title: "Details for " + (item.name || "image"),
        });
        var img = el("img", {
          src: previewSrc(item.url),
          alt: "",
          loading: "lazy",
          draggable: "false",
        });
        var foot = el("div", { class: "media-library-card-foot" });
        foot.appendChild(el("span", { class: "media-library-card-name", text: item.name || "—" }));
        foot.appendChild(
          el("span", {
            class: "media-library-card-meta",
            text:
              (item.usageCount > 0
                ? item.usageCount + " use" + (item.usageCount === 1 ? "" : "s")
                : "Unused") +
              " · " +
              formatBytes(item.size),
          }),
        );
        btn.appendChild(img);
        btn.appendChild(foot);
        btn.addEventListener("click", function () {
          openMediaDetail(item);
        });
        grid.appendChild(btn);
      });
    }

    function load() {
      summary.textContent = "Loading…";
      status.textContent = "";
      grid.innerHTML = "";
      fetch("media.php?action=list", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": window.CSRF_TOKEN || "" },
      })
        .then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok || !data || !data.ok) {
              throw new Error((data && data.error) || "Could not load media library.");
            }
            return data;
          });
        })
        .then(function (data) {
          items = Array.isArray(data.items) ? data.items : [];
          summary.textContent =
            (data.count || items.length) +
            " image" +
            ((data.count || items.length) === 1 ? "" : "s") +
            " · " +
            (data.used || 0) +
            " in use · " +
            (data.unused || 0) +
            " unused";
          paint();
        })
        .catch(function (err) {
          summary.textContent = "";
          status.className = "error media-library-status";
          status.textContent = (err && err.message) || "Could not load media library.";
        });
    }

    filter.addEventListener("input", paint);
    filterSelect.addEventListener("change", paint);
    refreshBtn.addEventListener("click", load);
    load();
  }

  function backupEditor(mount) {
    var wrap = el("div", { class: "admin-block" });
    wrap.appendChild(el("h2", { class: "admin-block-title", text: "Site backup" }));
    wrap.appendChild(
      el("p", {
        class: "section-desc",
        text: "Download everything the CMS stores, or import a previous zip to restore this server.",
      }),
    );

    var status = el("p", { class: "muted backup-status", text: "" });
    var progress = makeUploadProgress();
    progress.hide();

    function newBackupJobId() {
      var bytes = new Uint8Array(16);
      if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(bytes);
      } else {
        for (var i = 0; i < bytes.length; i++) bytes[i] = (Math.random() * 256) | 0;
      }
      return Array.prototype.map
        .call(bytes, function (b) {
          return ("0" + b.toString(16)).slice(-2);
        })
        .join("");
    }

    var download = el("button", {
      type: "button",
      class: "btn btn-orange",
      text: "Download backup (.zip)",
    });
    download.addEventListener("click", function () {
      status.className = "muted backup-status";
      status.textContent = "";
      download.disabled = true;
      importBtn.disabled = true;

      var job = newBackupJobId();
      var pollTimer = null;
      var stopped = false;

      progress.setProgress(1, "Preparing zip… 1%");

      function stopPoll() {
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }

      function pollProgress() {
        return fetch("backup.php?action=progress&job=" + encodeURIComponent(job), {
          headers: { "X-CSRF-Token": window.CSRF_TOKEN },
          cache: "no-store",
        })
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            if (stopped || !data || !data.ok) return;
            var pct = typeof data.percent === "number" ? data.percent : 0;
            var label = data.label || "Preparing zip…";
            if (data.state === "error") {
              throw new Error(data.error || "Backup failed");
            }
            if (data.state === "done") {
              progress.setProgress(100, "Backup ready — starting download…");
              return;
            }
            progress.setProgress(pct, label + (pct ? " " + pct + "%" : ""));
          })
          .catch(function () {
            /* ignore transient poll errors while prepare runs */
          });
      }

      pollTimer = setInterval(pollProgress, 250);
      pollProgress();

      fetch("backup.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": window.CSRF_TOKEN,
        },
        body: JSON.stringify({ action: "prepare", job: job }),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok || !data || !data.ok) {
              throw new Error((data && data.error) || "Could not prepare backup");
            }
            return data;
          });
        })
        .then(function (data) {
          progress.setProgress(100, "Downloading zip…");
          status.textContent = "Downloading…";
          return fetch("backup.php?action=download&job=" + encodeURIComponent(job), {
            headers: { "X-CSRF-Token": window.CSRF_TOKEN },
          }).then(function (r) {
            var type = (r.headers.get("content-type") || "").toLowerCase();
            if (!r.ok || type.indexOf("application/zip") === -1) {
              return r.json().then(function (errData) {
                throw new Error((errData && errData.error) || "Download failed");
              });
            }
            var disp = r.headers.get("content-disposition") || "";
            var match = /filename=\"?([^\";]+)\"?/i.exec(disp);
            var filename =
              match && match[1]
                ? match[1]
                : data.filename || "auburn-vsa-backup.zip";
            return r.blob().then(function (blob) {
              return { blob: blob, filename: filename };
            });
          });
        })
        .then(function (pack) {
          var url = URL.createObjectURL(pack.blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = pack.filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          progress.setProgress(100, "Backup downloaded");
          status.className = "muted backup-status";
          status.textContent = "Backup downloaded.";
          setTimeout(function () {
            progress.hide();
          }, 1200);
        })
        .catch(function (e) {
          progress.hide();
          status.className = "error backup-status";
          status.textContent = e.message || "Could not download backup.";
        })
        .then(function () {
          stopped = true;
          stopPoll();
          download.disabled = false;
          importBtn.disabled = false;
        });
    });

    var importBlock = el("div", { class: "backup-import" });
    importBlock.appendChild(el("h3", { class: "backup-import-title", text: "Import backup" }));
    importBlock.appendChild(
      el("p", {
        class: "section-desc",
        text:
          "Choose a previously downloaded .zip. This overwrites content, users, messages, blocked IPs, newsletter list, FAQ inbox, mail, scheduled publishes, the activity log, and uploads. Cannot be undone.",
      }),
    );

    var fileInput = el("input", { type: "file", accept: ".zip,application/zip" });
    var restorePw = el("label", { class: "backup-check" });
    var pwBox = el("input", { type: "checkbox" });
    restorePw.appendChild(pwBox);
    restorePw.appendChild(
      document.createTextNode(" Also restore admin password from the backup (optional)"),
    );

    var importBtn = el("button", {
      type: "button",
      class: "btn btn-outline",
      text: "Import & restore",
    });
    importBtn.addEventListener("click", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) {
        status.className = "error backup-status";
        status.textContent = "Choose a .zip file first.";
        return;
      }
      if (
        !confirm(
          "Import this backup and replace current site content, uploads, users, messages, blocked IPs, newsletters, FAQ inbox, mail, and scheduled publishes?",
        )
      ) {
        return;
      }
      status.className = "muted backup-status";
      status.textContent = "Importing…";
      progress.setProgress(null, "Importing backup…");
      importBtn.disabled = true;
      download.disabled = true;

      var fd = new FormData();
      fd.append("action", "import");
      fd.append("file", file);
      if (pwBox.checked) fd.append("restorePassword", "1");

      fetch("backup.php", {
        method: "POST",
        headers: { "X-CSRF-Token": window.CSRF_TOKEN },
        body: fd,
      })
        .then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok || !data || !data.ok) {
              throw new Error((data && data.error) || "Import failed");
            }
            return data;
          });
        })
        .then(function () {
          progress.setProgress(100, "Import complete");
          status.className = "muted backup-status";
          status.textContent = "Import complete. Reloading…";
          setTimeout(function () {
            location.reload();
          }, 600);
        })
        .catch(function (e) {
          progress.hide();
          status.className = "error backup-status";
          status.textContent = e.message || "Could not import backup.";
          importBtn.disabled = false;
          download.disabled = false;
        });
    });

    var actions = el("div", { class: "imgctl-actions backup-actions" });
    actions.appendChild(download);
    wrap.appendChild(actions);
    wrap.appendChild(progress.el);
    wrap.appendChild(importBlock);
    importBlock.appendChild(fileInput);
    importBlock.appendChild(restorePw);
    importBlock.appendChild(importBtn);
    wrap.appendChild(status);
    mount.appendChild(wrap);
  }

  function usersRequest(method, body) {
    var opts = {
      method: method,
      headers: { "X-CSRF-Token": window.CSRF_TOKEN },
    };
    if (body) {
      opts.headers["content-type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch("users.php", opts).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok || !data || !data.ok) {
          throw new Error((data && data.error) || "Request failed");
        }
        return data;
      });
    });
  }

  function passwordField(opts) {
    opts = opts || {};
    var wrap = el("div", { class: "users-pass-wrap" });
    var input = el("input", {
      type: "password",
      placeholder: opts.placeholder || "",
      autocomplete: opts.autocomplete || "new-password",
    });
    var btn = el("button", {
      type: "button",
      class: "users-pass-toggle",
      text: "Show",
      title: "Hold to show password",
      "aria-label": "Hold to show password",
    });
    function hide() {
      input.type = "password";
      btn.textContent = "Show";
    }
    function show() {
      input.type = "text";
      btn.textContent = "Hide";
    }
    btn.addEventListener("mousedown", function (e) {
      e.preventDefault();
      show();
    });
    btn.addEventListener("mouseup", hide);
    btn.addEventListener("mouseleave", hide);
    btn.addEventListener(
      "touchstart",
      function (e) {
        e.preventDefault();
        show();
      },
      { passive: false },
    );
    btn.addEventListener("touchend", hide);
    btn.addEventListener("touchcancel", hide);
    btn.addEventListener("blur", hide);
    wrap.appendChild(input);
    wrap.appendChild(btn);
    return { wrap: wrap, input: input };
  }

  function activityRequest(method, body, query) {
    var opts = {
      method: method,
      headers: { "X-CSRF-Token": window.CSRF_TOKEN },
    };
    if (method !== "GET" && body) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    var url = "activity.php" + (query || "");
    return fetch(url, opts).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok || !data || !data.ok) {
          throw new Error((data && data.error) || "Request failed");
        }
        return data;
      });
    });
  }

  function activityLogEditor(mount) {
    var wrap = el("div", { class: "admin-block activity-log-block" });
    wrap.appendChild(el("h2", { class: "admin-block-title", text: "Admin activity log" }));
    wrap.appendChild(
      el("p", {
        class: "section-desc",
        text: "Newest first. Secrets (passwords, tokens) are never stored.",
      }),
    );

    var filters = el("div", { class: "activity-filters" });
    var actorSel = el("select", { class: "activity-filter" });
    actorSel.appendChild(el("option", { value: "", text: "All actors" }));
    var actionSel = el("select", { class: "activity-filter" });
    actionSel.appendChild(el("option", { value: "", text: "All actions" }));
    var search = el("input", {
      type: "search",
      class: "activity-filter activity-search",
      placeholder: "Search detail / IP…",
    });
    var refreshBtn = el("button", { type: "button", class: "btn sm", text: "Refresh" });
    var clearBtn = el("button", { type: "button", class: "btn sm btn-danger-outline", text: "Clear log" });
    filters.appendChild(actorSel);
    filters.appendChild(actionSel);
    filters.appendChild(search);
    filters.appendChild(refreshBtn);
    filters.appendChild(clearBtn);
    wrap.appendChild(filters);

    var status = el("p", { class: "muted activity-log-status", text: "Loading…" });
    var tableWrap = el("div", { class: "activity-table-wrap" });
    var table = el("table", { class: "activity-table" });
    var thead = el("thead");
    var headRow = el("tr");
    ["When", "Actor", "Action", "Summary", "IP"].forEach(function (label) {
      headRow.appendChild(el("th", { text: label }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = el("tbody");
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrap.appendChild(status);
    wrap.appendChild(tableWrap);
    mount.appendChild(wrap);

    function fillSelect(sel, values, keep) {
      var current = keep || sel.value || "";
      while (sel.options.length > 1) sel.remove(1);
      (values || []).forEach(function (v) {
        sel.appendChild(el("option", { value: v, text: v }));
      });
      sel.value = current;
      if (sel.value !== current) sel.value = "";
    }

    function formatWhen(iso) {
      if (!iso) return "—";
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      try {
        return d.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        return iso;
      }
    }

    function queryString() {
      var parts = [];
      if (actorSel.value) parts.push("actor=" + encodeURIComponent(actorSel.value));
      if (actionSel.value) parts.push("action=" + encodeURIComponent(actionSel.value));
      if (search.value.trim()) parts.push("q=" + encodeURIComponent(search.value.trim()));
      parts.push("limit=300");
      return parts.length ? "?" + parts.join("&") : "?limit=300";
    }

    function paint(data) {
      fillSelect(actorSel, data.actors || [], actorSel.value);
      fillSelect(actionSel, data.actions || [], actionSel.value);
      tbody.innerHTML = "";
      var items = data.items || [];
      var total = data.total || 0;
      if (!items.length) {
        status.className = "muted activity-log-status";
        status.textContent = total ? "No entries match these filters." : "No activity recorded yet.";
        return;
      }
      status.className = "muted activity-log-status";
      status.textContent =
        "Showing " + items.length + " of " + total + " entries (newest first). Cap: " + (data.maxEntries || 5000) + ".";
      items.forEach(function (row) {
        var tr = el("tr");
        var actorName = row.username || "—";
        var role = row.role || "";
        var actor =
          role && role !== actorName && !(actorName === "public" && role === "public")
            ? actorName + " · " + role
            : actorName;
        tr.appendChild(el("td", { class: "activity-when", text: formatWhen(row.createdAt) }));
        tr.appendChild(el("td", { text: actor }));
        tr.appendChild(el("td", { class: "activity-action", text: row.action || "—" }));
        tr.appendChild(el("td", { text: row.detail || "—" }));
        tr.appendChild(el("td", { class: "activity-ip", text: row.ip || "—" }));
        tbody.appendChild(tr);
      });
    }

    function load() {
      status.className = "muted activity-log-status";
      status.textContent = "Loading…";
      activityRequest("GET", null, queryString())
        .then(paint)
        .catch(function (e) {
          status.className = "error activity-log-status";
          status.textContent = (e && e.message) || "Could not load activity log.";
        });
    }

    var searchTimer = null;
    actorSel.addEventListener("change", load);
    actionSel.addEventListener("change", load);
    search.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(load, 280);
    });
    refreshBtn.addEventListener("click", load);
    clearBtn.addEventListener("click", function () {
      if (!confirm("Clear the entire activity log? This cannot be undone.")) return;
      activityRequest("POST", { action: "clear" })
        .then(paint)
        .catch(function (e) {
          alert((e && e.message) || "Could not clear log.");
        });
    });

    load();
  }

  function usersEditor(mount) {
    var wrap = el("div", { class: "admin-block" });
    wrap.appendChild(el("h2", { class: "admin-block-title", text: "Manage users" }));
    wrap.appendChild(
      el("p", {
        class: "section-desc",
        text: "Root account is “admin”. Editors only see the sections and mailboxes you allow.",
      }),
    );
    var status = el("p", { class: "muted", text: "Loading…" });
    var toolbar = el("div", { class: "imgctl-actions" });
    var addBtn = el("button", { type: "button", class: "btn btn-orange sm", text: "Add user" });
    toolbar.appendChild(addBtn);
    var list = el("div", { class: "list-rows users-list" });
    wrap.appendChild(status);
    wrap.appendChild(toolbar);
    wrap.appendChild(list);
    mount.appendChild(wrap);

    var catalog = ADMIN_PERM_CATALOG || {};
    var permIds = Object.keys(catalog).filter(function (id) {
      return id !== "users";
    });
    var mailCatalog = window.ADMIN_MAIL_CATALOG || [
      { id: "info", label: "Info", address: "info@auburnvsa.com" },
      { id: "sale", label: "Sale", address: "sale@auburnvsa.com" },
    ];
    var sheetOpen = false;
    var usersCache = [];

    function selectedKeys(checks) {
      return Object.keys(checks).filter(function (id) {
        return checks[id].checked;
      });
    }

    function buildPermChecks(selected) {
      selected = selected || [];
      var box = el("div", { class: "users-perms" });
      var checks = {};
      permIds.forEach(function (id) {
        var lab = el("label", { class: "users-perm" });
        var cb = el("input", { type: "checkbox", value: id });
        cb.checked = selected.indexOf(id) !== -1;
        checks[id] = cb;
        lab.appendChild(cb);
        lab.appendChild(document.createTextNode(" " + (catalog[id] || id)));
        box.appendChild(lab);
      });
      return { box: box, checks: checks };
    }

    function buildMailboxChecks(selected) {
      selected = selected || [];
      var box = el("div", { class: "users-perms" });
      var checks = {};
      mailCatalog.forEach(function (m) {
        var lab = el("label", { class: "users-perm" });
        var cb = el("input", { type: "checkbox", value: m.id });
        cb.checked = selected.indexOf(m.id) !== -1;
        checks[m.id] = cb;
        lab.appendChild(cb);
        lab.appendChild(
          document.createTextNode(" " + (m.address || m.id) + " (" + (m.label || m.id) + ")"),
        );
        box.appendChild(lab);
      });
      return { box: box, checks: checks };
    }

    function userSummary(user) {
      if (user.role === "root") return "Root · full access";
      if (!user.active) return "Inactive editor";
      var n = (user.permissions || []).length;
      var boxes = (user.mailboxes || []).length;
      return (
        "Editor · " +
        n +
        " section" +
        (n === 1 ? "" : "s") +
        (boxes ? " · " + boxes + " mailbox" + (boxes === 1 ? "" : "es") : "")
      );
    }

    function openUserSheet(mode, user) {
      if (sheetOpen) return;
      sheetOpen = true;
      var isCreate = mode === "create";
      var isRoot = !isCreate && user && user.role === "root";
      var title = isCreate ? "Add user" : isRoot ? "Root admin" : "Edit “" + user.username + "”";

      var overlay = el("div", { class: "admin-sheet", "aria-hidden": "false" });
      var backdrop = el("div", { class: "admin-sheet-backdrop" });
      var panel = el("div", {
        class: "admin-sheet-panel",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": title,
      });
      var head = el("header", { class: "admin-sheet-head" });
      head.appendChild(el("h2", { text: title }));
      var closeBtn = el("button", {
        type: "button",
        class: "admin-sheet-close",
        "aria-label": "Close",
        text: "×",
      });
      head.appendChild(closeBtn);
      panel.appendChild(head);

      var body = el("div", { class: "admin-sheet-body users-sheet-body" });
      var usernameInput = null;
      var passCtl = null;
      var confirmCtl = null;
      var permCtl = null;
      var mailCtl = null;

      if (isRoot) {
        body.appendChild(
          el("p", {
            class: "muted",
            text: "Full access to every section and both mailboxes. Cannot be deleted or deactivated. Change this password with Change password in the header (current password required). Forgotten passwords can only be reset from the hidden owner page.",
          }),
        );
      } else {
        if (isCreate) {
          var userField = el("div", { class: "users-field" });
          userField.appendChild(el("label", { text: "Username" }));
          usernameInput = el("input", {
            type: "text",
            placeholder: "e.g. editor1",
            autocomplete: "off",
          });
          userField.appendChild(usernameInput);
          body.appendChild(userField);
        } else {
          body.appendChild(el("p", { class: "users-sheet-username", text: "Username: " + user.username }));
        }

        var passField = el("div", { class: "users-field" });
        passField.appendChild(
          el("label", { text: isCreate ? "Temporary password" : "New password (leave blank to keep)" }),
        );
        passCtl = passwordField({
          placeholder: isCreate ? "Min 10 characters" : "Leave blank to keep current",
          autocomplete: "new-password",
        });
        passField.appendChild(passCtl.wrap);
        body.appendChild(passField);

        if (isCreate) {
          var confirmField = el("div", { class: "users-field" });
          confirmField.appendChild(el("label", { text: "Confirm password" }));
          confirmCtl = passwordField({
            placeholder: "Re-enter password",
            autocomplete: "new-password",
          });
          confirmField.appendChild(confirmCtl.wrap);
          body.appendChild(confirmField);
        }

        body.appendChild(
          el("p", {
            class: "muted users-perms-label",
            text: "Roles (check one or more — combines access)",
          }),
        );
        var presetRow = el("div", { class: "users-presets" });
        var rolePresets = [
          {
            id: "content",
            label: "Content",
            title: "Home, Team, Events, Royale, Gallery, Merch, FAQs, Media",
            perms: ["home", "team", "events", "royale", "gallery", "merch", "faqs", "media"],
          },
          {
            id: "comms",
            label: "Comms",
            title: "Newsletter, Mail, FAQ Inbox, Messages",
            perms: ["subscribers", "mail", "faq-inbox", "messages"],
          },
          {
            id: "ops",
            label: "Ops",
            title: "Site, Music, Publish, Blocked IPs, Backup, Media",
            perms: ["site", "music", "publish", "blocked-ips", "backup", "media"],
          },
        ];
        var initialPerms = isCreate ? [] : user.permissions || [];
        permCtl = buildPermChecks(initialPerms);
        var roleChecks = {};
        var syncingRoles = false;

        function roleFullyGranted(preset) {
          return preset.perms.every(function (id) {
            return permCtl.checks[id] && permCtl.checks[id].checked;
          });
        }

        function syncRoleChecksFromPerms() {
          syncingRoles = true;
          rolePresets.forEach(function (preset) {
            if (roleChecks[preset.id]) {
              roleChecks[preset.id].checked = roleFullyGranted(preset);
            }
          });
          syncingRoles = false;
        }

        function applyRolePresetChange(preset, checked) {
          preset.perms.forEach(function (id) {
            if (!permCtl.checks[id]) return;
            if (checked) {
              permCtl.checks[id].checked = true;
              return;
            }
            // Uncheck only if no other still-checked role includes this section.
            var stillNeeded = rolePresets.some(function (other) {
              return (
                other.id !== preset.id &&
                roleChecks[other.id] &&
                roleChecks[other.id].checked &&
                other.perms.indexOf(id) !== -1
              );
            });
            if (!stillNeeded) permCtl.checks[id].checked = false;
          });
        }

        rolePresets.forEach(function (preset) {
          var lab = el("label", {
            class: "users-preset-check",
            title: preset.title,
          });
          var cb = el("input", { type: "checkbox", value: preset.id });
          cb.checked = !isCreate && roleFullyGranted(preset);
          roleChecks[preset.id] = cb;
          lab.appendChild(cb);
          lab.appendChild(document.createTextNode(" " + preset.label));
          cb.addEventListener("change", function () {
            if (syncingRoles) return;
            applyRolePresetChange(preset, cb.checked);
          });
          presetRow.appendChild(lab);
        });

        var allRolesBtn = el("button", {
          type: "button",
          class: "btn-ghost users-preset-btn",
          text: "All roles",
          title: "Check Content, Comms, and Ops",
        });
        var clearRolesBtn = el("button", {
          type: "button",
          class: "btn-ghost users-preset-btn",
          text: "Clear",
          title: "Uncheck all roles and sections",
        });
        allRolesBtn.addEventListener("click", function () {
          rolePresets.forEach(function (preset) {
            if (!roleChecks[preset.id].checked) {
              roleChecks[preset.id].checked = true;
              applyRolePresetChange(preset, true);
            }
          });
        });
        clearRolesBtn.addEventListener("click", function () {
          rolePresets.forEach(function (preset) {
            roleChecks[preset.id].checked = false;
          });
          permIds.forEach(function (id) {
            if (permCtl.checks[id]) permCtl.checks[id].checked = false;
          });
        });
        presetRow.appendChild(allRolesBtn);
        presetRow.appendChild(clearRolesBtn);
        body.appendChild(presetRow);

        permIds.forEach(function (id) {
          if (!permCtl.checks[id]) return;
          permCtl.checks[id].addEventListener("change", syncRoleChecksFromPerms);
        });

        body.appendChild(el("p", { class: "muted users-perms-label", text: "Section access" }));
        body.appendChild(permCtl.box);
        body.appendChild(
          el("p", {
            class: "muted users-perms-label",
            text: "Mailboxes (only used if Mail permission is checked)",
          }),
        );
        mailCtl = buildMailboxChecks(isCreate ? [] : user.mailboxes || []);
        body.appendChild(mailCtl.box);
      }

      panel.appendChild(body);
      var actions = el("div", { class: "admin-sheet-actions" });
      var primary = el("button", {
        type: "button",
        class: "btn btn-orange",
        text: isCreate ? "Create user" : isRoot ? "Close" : "Save user",
      });
      var cancel = el("button", { type: "button", class: "btn-ghost", text: "Cancel" });
      actions.appendChild(primary);
      if (!isRoot) actions.appendChild(cancel);

      if (!isCreate && !isRoot) {
        var toggle = el("button", {
          type: "button",
          class: "btn-ghost",
          text: user.active ? "Deactivate" : "Reactivate",
        });
        var del = el("button", { type: "button", class: "link-danger", text: "Delete" });
        actions.appendChild(toggle);
        actions.appendChild(del);
        toggle.addEventListener("click", function () {
          toggle.disabled = true;
          usersRequest("POST", {
            action: "update",
            username: user.username,
            active: !user.active,
            permissions: user.permissions || [],
            mailboxes: user.mailboxes || [],
          })
            .then(function (data) {
              finish();
              paint(data.users || []);
            })
            .catch(function (e) {
              toggle.disabled = false;
              alert(e.message || "Could not update user.");
            });
        });
        del.addEventListener("click", function () {
          if (!confirm("Delete user “" + user.username + "”? This cannot be undone.")) return;
          del.disabled = true;
          usersRequest("POST", { action: "delete", username: user.username })
            .then(function (data) {
              finish();
              paint(data.users || []);
            })
            .catch(function (e) {
              del.disabled = false;
              alert(e.message || "Could not delete user.");
            });
        });
      }

      panel.appendChild(actions);
      overlay.appendChild(backdrop);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      document.body.classList.add("admin-sheet-lock");
      requestAnimationFrame(function () {
        overlay.classList.add("is-open");
      });

      var closed = false;
      function finish() {
        if (closed) return;
        closed = true;
        sheetOpen = false;
        overlay.style.pointerEvents = "none";
        overlay.setAttribute("aria-hidden", "true");
        overlay.setAttribute("data-closing", "1");
        overlay.classList.remove("is-open");
        setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          document.removeEventListener("keydown", onKey);
          if (!document.querySelector(".admin-sheet.is-open")) {
            document.body.classList.remove("admin-sheet-lock");
          }
        }, 220);
      }
      function onKey(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          finish();
        }
      }

      closeBtn.addEventListener("click", finish);
      backdrop.addEventListener("click", finish);
      cancel.addEventListener("click", finish);
      document.addEventListener("keydown", onKey);

      primary.addEventListener("click", function () {
        if (isRoot) {
          finish();
          return;
        }
        if (isCreate) {
          var username = (usernameInput.value || "").trim();
          var password = passCtl.input.value || "";
          var confirmPw = confirmCtl.input.value || "";
          if (username.length < 3) {
            alert("Username must be at least 3 characters.");
            return;
          }
          if (password.length < 10) {
            alert("Password must be at least 10 characters and include a letter and a number.");
            return;
          }
          if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            alert("Password must include at least one letter and one number.");
            return;
          }
          if (password !== confirmPw) {
            alert("Password and confirmation do not match.");
            return;
          }
          primary.disabled = true;
          usersRequest("POST", {
            action: "create",
            username: username,
            password: password,
            permissions: selectedKeys(permCtl.checks),
            mailboxes: selectedKeys(mailCtl.checks),
            active: true,
          })
            .then(function (data) {
              finish();
              paint(data.users || []);
            })
            .catch(function (e) {
              primary.disabled = false;
              alert(e.message || "Could not create user.");
            });
          return;
        }

        primary.disabled = true;
        var body = {
          action: "update",
          username: user.username,
          permissions: selectedKeys(permCtl.checks),
          mailboxes: selectedKeys(mailCtl.checks),
          active: user.active,
        };
        if (passCtl.input.value) body.password = passCtl.input.value;
        usersRequest("POST", body)
          .then(function (data) {
            finish();
            paint(data.users || []);
          })
          .catch(function (e) {
            primary.disabled = false;
            alert(e.message || "Could not save user.");
          });
      });

      setTimeout(function () {
        try {
          if (usernameInput) usernameInput.focus();
          else primary.focus();
        } catch (err) {}
      }, 40);
    }

    function paint(users) {
      usersCache = users || [];
      list.innerHTML = "";
      status.className = "muted";
      status.textContent =
        usersCache.length + " account" + (usersCache.length === 1 ? "" : "s") + " · click Edit to open";
      usersCache.forEach(function (user) {
        var row = el("div", {
          class: "list-row is-collapsed" + (user.active ? "" : " is-disabled"),
        });
        var bar = el("div", { class: "list-row-bar", role: "button", tabindex: "0" });
        var left = el("div", { class: "list-row-bar-left" });
        var textCol = el("div", { class: "list-row-text" });
        textCol.appendChild(el("span", { class: "list-row-summary", text: user.username }));
        textCol.appendChild(el("span", { class: "list-row-date", text: userSummary(user) }));
        left.appendChild(textCol);
        var actions = el("div", { class: "list-row-bar-actions" });
        var editBtn = el("button", {
          type: "button",
          class: "btn-outline list-row-toggle",
          text: user.role === "root" ? "View" : "Edit",
        });
        editBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          openUserSheet(user.role === "root" ? "view" : "edit", user);
        });
        actions.appendChild(editBtn);
        bar.appendChild(left);
        bar.appendChild(actions);
        bar.addEventListener("click", function (e) {
          if (e.target.closest && e.target.closest("button, a")) return;
          openUserSheet(user.role === "root" ? "view" : "edit", user);
        });
        bar.addEventListener("keydown", function (e) {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          openUserSheet(user.role === "root" ? "view" : "edit", user);
        });
        row.appendChild(bar);
        list.appendChild(row);
      });
    }

    addBtn.addEventListener("click", function () {
      openUserSheet("create", null);
    });

    usersRequest("GET")
      .then(function (data) {
        if (data.catalog) {
          Object.keys(data.catalog).forEach(function (k) {
            ADMIN_PERM_CATALOG[k] = data.catalog[k];
          });
          catalog = ADMIN_PERM_CATALOG;
          permIds = Object.keys(catalog).filter(function (id) {
            return id !== "users";
          });
        }
        paint(data.users || []);
      })
      .catch(function (e) {
        status.className = "error";
        status.textContent = e.message || "Could not load users.";
      });
  }

  function mailRequest(method, urlOrBody, body) {
    var url = "mail.php";
    var opts = {
      method: method,
      headers: { "X-CSRF-Token": window.CSRF_TOKEN },
    };
    if (method === "GET") {
      url = "mail.php" + (urlOrBody || "");
    } else if (urlOrBody) {
      opts.headers["content-type"] = "application/json";
      opts.body = JSON.stringify(urlOrBody);
    }
    if (body) {
      opts.headers["content-type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch(url, opts).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok || !data || !data.ok) {
          throw new Error((data && data.error) || "Request failed");
        }
        return data;
      });
    });
  }

  function mailEditor(mount) {
    var CLUB_GMAIL = "vsaauburn@gmail.com";
    var wrap = el("div", { class: "admin-block mail-app" });
    var statusLine = el("p", { class: "muted mail-status", text: "Loading…" });
    wrap.appendChild(statusLine);

    var toolbar = el("div", { class: "mail-toolbar" });
    var boxSelect = el("select", { class: "mail-select", "aria-label": "Mailbox" });
    var folderSelect = el("select", { class: "mail-select", "aria-label": "Folder" });
    [
      { value: "inbox", label: "Inbox" },
      { value: "archive", label: "Archive" },
      { value: "trash", label: "Trash" },
    ].forEach(function (f) {
      folderSelect.appendChild(el("option", { value: f.value, text: f.label }));
    });
    var refreshBtn = el("button", { type: "button", class: "btn-ghost", text: "Refresh" });
    toolbar.appendChild(boxSelect);
    toolbar.appendChild(folderSelect);
    toolbar.appendChild(refreshBtn);
    wrap.appendChild(toolbar);

    var layout = el("div", { class: "mail-layout" });
    var list = el("div", { class: "mail-list" });
    var reader = el("div", { class: "mail-reader" });
    reader.appendChild(
      el("p", {
        class: "muted",
        text: "Select a message to read it. Reply opens Gmail as the club account.",
      }),
    );
    layout.appendChild(list);
    layout.appendChild(reader);
    wrap.appendChild(layout);
    mount.appendChild(wrap);

    var state = {
      mailboxes: [],
      mailbox: "",
      folder: "inbox",
      items: [],
      status: null,
    };

    function qs() {
      return (
        "?mailbox=" +
        encodeURIComponent(state.mailbox) +
        "&folder=" +
        encodeURIComponent(state.folder)
      );
    }

    function postMail(action, id) {
      return mailRequest("POST", { action: action, mailbox: state.mailbox, id: id }).then(function () {
        return reload();
      });
    }

    function extractEmail(from) {
      var s = String(from || "").trim();
      var angle = s.match(/<([^>]+)>/);
      if (angle && angle[1]) return angle[1].trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return s;
      return "";
    }

    function gmailComposeUrl(msg) {
      var to = extractEmail(msg.from);
      var sub = String(msg.subject || "");
      if (sub && !/^re:/i.test(sub)) sub = "Re: " + sub;
      var quote =
        "\n\n---\nOn " +
        (msg.date || "") +
        ", " +
        (msg.from || "") +
        " wrote:\n\n" +
        String(msg.text || "").slice(0, 4000);
      var url =
        "https://mail.google.com/mail/?view=cm&fs=1&authuser=" +
        encodeURIComponent(CLUB_GMAIL) +
        "&to=" +
        encodeURIComponent(to) +
        "&su=" +
        encodeURIComponent(sub) +
        "&body=" +
        encodeURIComponent(quote);
      return url;
    }

    function paintList() {
      list.innerHTML = "";
      if (!state.items.length) {
        list.appendChild(el("p", { class: "muted", text: "No messages in this folder." }));
        return;
      }
      state.items.forEach(function (item) {
        var row = el("button", {
          type: "button",
          class: "mail-row" + (item.read ? "" : " is-unread"),
        });
        row.appendChild(el("strong", { text: item.subject || "(no subject)" }));
        row.appendChild(
          el("span", {
            class: "mail-row-meta",
            text: (item.from || "") + " · " + formatInboxDate(item.date),
          }),
        );
        row.appendChild(el("span", { class: "mail-row-preview", text: item.preview || "" }));
        row.addEventListener("click", function () {
          openMessage(item.id);
        });
        list.appendChild(row);
      });
    }

    function openMessage(id) {
      reader.innerHTML = "";
      reader.appendChild(el("p", { class: "muted", text: "Loading…" }));
      mailRequest("GET", qs() + "&id=" + encodeURIComponent(id))
        .then(function (data) {
          var m = data.message || {};
          reader.innerHTML = "";
          var head = el("div", { class: "mail-msg-head" });
          head.appendChild(el("h3", { text: m.subject || "(no subject)" }));
          head.appendChild(el("p", { class: "muted", text: "From: " + (m.from || "") }));
          head.appendChild(el("p", { class: "muted", text: "To: " + ((m.to || []).join(", ") || "—") }));
          if ((m.cc || []).length) {
            head.appendChild(el("p", { class: "muted", text: "Cc: " + m.cc.join(", ") }));
          }
          head.appendChild(el("p", { class: "muted", text: formatInboxDate(m.date) }));
          reader.appendChild(head);
          var body = el("pre", { class: "mail-msg-body", text: m.text || "" });
          reader.appendChild(body);
          var actions = el("div", { class: "imgctl-actions" });
          var folder = m.folder || "inbox";
          var replyTo = extractEmail(m.from);

          if (folder !== "trash" && replyTo) {
            var gmailBtn = el("a", {
              class: "btn btn-orange sm",
              href: gmailComposeUrl(m),
              target: "_blank",
              rel: "noopener noreferrer",
              text: "Reply via Gmail",
            });
            gmailBtn.title = "Opens compose as " + CLUB_GMAIL + " (log into that account first)";
            actions.appendChild(gmailBtn);
          }

          if (folder === "trash") {
            var restore = el("button", { type: "button", class: "btn-ghost", text: "Restore" });
            actions.appendChild(restore);
            restore.addEventListener("click", function () {
              postMail("restore", m.id).catch(function (e) {
                alert(e.message || "Could not restore.");
              });
            });
          } else {
            if (folder === "archive") {
              var unarchive = el("button", { type: "button", class: "btn-ghost", text: "Move to Inbox" });
              actions.appendChild(unarchive);
              unarchive.addEventListener("click", function () {
                postMail("unarchive", m.id).catch(function (e) {
                  alert(e.message || "Could not move.");
                });
              });
            } else {
              var archive = el("button", { type: "button", class: "btn-ghost", text: "Archive" });
              actions.appendChild(archive);
              archive.addEventListener("click", function () {
                postMail("archive", m.id).catch(function (e) {
                  alert(e.message || "Could not archive.");
                });
              });
            }
            var del = el("button", { type: "button", class: "link-danger", text: "Delete" });
            actions.appendChild(del);
            del.addEventListener("click", function () {
              if (!confirm("Move this message to Trash? You can restore it later.")) return;
              postMail("delete", m.id).catch(function (e) {
                alert(e.message || "Could not delete.");
              });
            });
          }
          reader.appendChild(actions);
          return reload(true);
        })
        .catch(function (e) {
          reader.innerHTML = "";
          reader.appendChild(el("p", { class: "error", text: e.message || "Could not open message." }));
        });
    }

    function reload(keepReader) {
      if (!state.mailbox) return Promise.resolve();
      return mailRequest("GET", qs()).then(function (data) {
        state.items = data.items || [];
        state.status = data.status || null;
        if (typeof data.unreadCount === "number") {
          setMailUnreadCount(data.unreadCount);
        } else {
          refreshMailNavBadge();
        }
        paintList();
        statusLine.textContent = "";
        statusLine.hidden = true;
        if (!keepReader) {
          reader.innerHTML = "";
          reader.appendChild(
            el("p", {
              class: "muted",
              text: "Select a message to read it. Reply opens Gmail as the club account.",
            }),
          );
        }
      });
    }

    refreshBtn.addEventListener("click", function () {
      reload();
    });
    folderSelect.addEventListener("change", function () {
      state.folder = folderSelect.value;
      reload();
    });
    boxSelect.addEventListener("change", function () {
      state.mailbox = boxSelect.value;
      reload();
    });

    mailRequest("GET", "?action=status")
      .then(function (data) {
        state.mailboxes = data.mailboxes || [];
        boxSelect.innerHTML = "";
        if (!state.mailboxes.length) {
          statusLine.hidden = false;
          statusLine.className = "error";
          statusLine.textContent = "No mailbox access. Ask root to grant Mail + mailboxes.";
          return;
        }
        state.mailboxes.forEach(function (b) {
          boxSelect.appendChild(el("option", { value: b.id, text: b.address }));
        });
        state.mailbox = state.mailboxes[0].id;
        return reload();
      })
      .catch(function () {
        statusLine.hidden = false;
        statusLine.className = "error";
        statusLine.textContent = "Could not load mail.";
      });
  }

  function subscribersRequest(method, body) {
    var opts = {
      method: method,
      headers: { "X-CSRF-Token": window.CSRF_TOKEN },
    };
    if (body) {
      opts.headers["content-type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch("subscribers.php", opts).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok || !data || data.ok === false) {
          throw new Error((data && data.error) || "Request failed");
        }
        return data;
      });
    });
  }

  function publishQueueEditor(mount) {
    var wrap = el("div", { class: "admin-block" });
    wrap.appendChild(el("h2", { class: "admin-block-title", text: "How publishing works" }));
    wrap.appendChild(
      el("p", {
        class: "section-desc",
        text:
          "Saving a CMS page opens Publish ASAP or Schedule. ASAP goes live immediately. Schedule waits until the due time, then applies on the next site/API load.",
      }),
    );
    var steps = el("ul", { class: "publish-queue-steps" });
    [
      "Publish ASAP — live right away.",
      "Schedule — queued until the due time (live content unchanged until then).",
      "Uploads are available immediately; scheduling only delays which content uses them.",
      "Logo upload publishes ASAP with no dialog.",
    ].forEach(function (line) {
      steps.appendChild(el("li", { text: line }));
    });
    wrap.appendChild(steps);
    mount.appendChild(wrap);

    var queueBlock = el("div", { class: "admin-block" });
    queueBlock.appendChild(el("h2", { class: "admin-block-title", text: "Scheduled publishes" }));
    queueBlock.appendChild(
      el("p", {
        class: "section-desc",
        text: "Pending jobs waiting to go live after their time. Cancel removes them from the queue.",
      }),
    );
    var queueActions = el("div", { class: "imgctl-actions" });
    var refreshQueue = el("button", { type: "button", class: "btn-ghost", text: "Refresh queue" });
    queueActions.appendChild(refreshQueue);
    queueBlock.appendChild(queueActions);
    var queueStatus = el("p", { class: "muted", text: "Loading…" });
    var queueList = el("div", { class: "publish-queue-list" });
    queueBlock.appendChild(queueStatus);
    queueBlock.appendChild(queueList);
    mount.appendChild(queueBlock);

    function paintQueue(pending) {
      window.PUBLISH_PENDING = Array.isArray(pending) ? pending : [];
      refreshPublishBanner();
      queueList.innerHTML = "";
      if (!window.PUBLISH_PENDING.length) {
        queueStatus.className = "muted";
        queueStatus.textContent = "No scheduled publishes.";
        return;
      }
      queueStatus.className = "muted";
      queueStatus.textContent =
        window.PUBLISH_PENDING.length +
        " scheduled job" +
        (window.PUBLISH_PENDING.length === 1 ? "" : "s") +
        ".";
      window.PUBLISH_PENDING.forEach(function (item) {
        if (!item || !item.id) return;
        var row = el("div", { class: "publish-queue-row" });
        var sections =
          item.sections && typeof item.sections === "object" ? Object.keys(item.sections) : [];
        var meta = el("div", { class: "publish-queue-meta" });
        meta.appendChild(el("strong", { text: formatPublishAt(item.publishAt) }));
        meta.appendChild(
          el("p", {
            class: "muted",
            text:
              (item.page ? "Page: " + item.page + " · " : "") +
              (sections.length ? sections.join(", ") : "sections") +
              (item.username ? " · " + item.username : ""),
          }),
        );
        row.appendChild(meta);
        var cancelBtn = el("button", {
          type: "button",
          class: "btn-outline",
          text: "Cancel",
        });
        cancelBtn.addEventListener("click", function () {
          if (!confirm("Cancel this scheduled publish?")) return;
          cancelBtn.disabled = true;
          fetch("publish.php", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "X-CSRF-Token": window.CSRF_TOKEN || "",
            },
            credentials: "same-origin",
            body: JSON.stringify({
              action: "cancel",
              id: item.id,
              csrf: window.CSRF_TOKEN || "",
            }),
            cache: "no-store",
          })
            .then(function (r) {
              return r.json().then(function (data) {
                if (!r.ok || !data || !data.ok) {
                  throw new Error((data && data.error) || "Could not cancel.");
                }
                return data;
              });
            })
            .then(function () {
              window.PUBLISH_PENDING = (window.PUBLISH_PENDING || []).filter(function (p) {
                return p && p.id !== item.id;
              });
              paintQueue(window.PUBLISH_PENDING);
            })
            .catch(function (err) {
              cancelBtn.disabled = false;
              alert((err && err.message) || "Could not cancel schedule.");
            });
        });
        row.appendChild(cancelBtn);
        queueList.appendChild(row);
      });
    }

    function reloadQueue() {
      queueStatus.textContent = "Loading…";
      fetchPublishPending().then(function () {
        paintQueue(window.PUBLISH_PENDING || []);
      });
    }

    refreshQueue.addEventListener("click", reloadQueue);
    paintQueue(window.PUBLISH_PENDING || []);
    reloadQueue();
  }

  function newsletterComposeRequest(method, body, query) {
    var url = "newsletter-compose.php" + (query ? query : "");
    var opts = {
      method: method,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "X-CSRF-Token": window.CSRF_TOKEN || "" },
    };
    if (body) {
      opts.headers["content-type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch(url, opts).then(function (r) {
      return r.text().then(function (text) {
        var data = null;
        try {
          data = JSON.parse(text || "{}");
        } catch (err) {
          throw new Error("Newsletter compose failed (invalid server response).");
        }
        if (!r.ok || !data || !data.ok) {
          throw new Error((data && data.error) || "Newsletter compose request failed.");
        }
        return data;
      });
    });
  }

  function copyTextToClipboard(text, btn, okLabel) {
    var restore = btn.textContent;
    var done = function () {
      btn.textContent = okLabel || "Copied!";
      setTimeout(function () {
        btn.textContent = restore;
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(done).catch(function () {
        prompt("Copy this text:", text);
        done();
      });
    }
    prompt("Copy this text:", text);
    done();
    return Promise.resolve();
  }

  function newsletterHtmlBodyFragment(fullHtml) {
    var fragment = fullHtml || "";
    try {
      var parsed = new DOMParser().parseFromString(fullHtml || "", "text/html");
      if (parsed && parsed.body) {
        fragment = parsed.body.innerHTML || fullHtml;
      }
    } catch (err) {
      fragment = fullHtml || "";
    }
    return fragment;
  }

  /**
   * Copy rendered email so Gmail paste keeps layout (raw HTML source pastes as code).
   * Writes text/html + text/plain; falls back to a hidden contenteditable selection.
   */
  function copyRichEmailToClipboard(fullHtml, plain) {
    var fragment = newsletterHtmlBodyFragment(fullHtml);
    var plainText = plain || "";

    if (navigator.clipboard && window.ClipboardItem) {
      try {
        var item = new ClipboardItem({
          "text/html": new Blob([fragment], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        });
        return navigator.clipboard.write([item]);
      } catch (err) {
        /* fall through */
      }
    }

    return new Promise(function (resolve, reject) {
      var host = document.createElement("div");
      host.setAttribute("contenteditable", "true");
      host.setAttribute("aria-hidden", "true");
      host.style.cssText =
        "position:fixed;left:-9999px;top:0;width:600px;height:1px;opacity:0;overflow:hidden;pointer-events:none;";
      host.innerHTML = fragment;
      document.body.appendChild(host);
      var range = document.createRange();
      range.selectNodeContents(host);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      sel.removeAllRanges();
      host.remove();
      if (ok) resolve();
      else reject(new Error("Clipboard copy failed"));
    });
  }

  function openExternalTab(url) {
    // No windowFeatures — those force a popup chrome where Gmail often stays blank.
    // Never navigate this admin tab away if the popup is blocked.
    var w = null;
    try {
      w = window.open(url, "_blank");
    } catch (err) {
      w = null;
    }
    if (w) {
      try {
        w.opener = null;
      } catch (err2) {
        /* ignore */
      }
      return w;
    }
    return null;
  }

  /** Open Gmail inbox in a new tab only (never replaces the admin page). */
  function openGmailInbox() {
    var w = openExternalTab("https://mail.google.com/mail/u/0/#inbox");
    if (!w) {
      alert(
        "Pop-up blocked — your admin tab was left open.\n\nAllow pop-ups for this site, then click Open Gmail again.\n\nOr open mail.google.com manually and paste with Ctrl+V.",
      );
    }
    return w;
  }

  function openGmailCompose(subject, bodyHint) {
    openGmailInbox();
  }

  /**
   * Green temporary notice after Copy for Gmail — clipboard ready; subject later.
   */
  function showGmailClipboardToast(opts) {
    opts = opts || {};
    var existing = document.querySelector(".gmail-clipboard-toast");
    if (existing) existing.remove();
    if (window.__vsaGmailToastTimer) {
      clearTimeout(window.__vsaGmailToastTimer);
      window.__vsaGmailToastTimer = null;
    }

    var toast = el("div", {
      class: "gmail-clipboard-toast",
      role: "status",
      "aria-live": "polite",
    });
    var inner = el("div", { class: "gmail-clipboard-toast-inner" });
    inner.appendChild(el("strong", { class: "gmail-clipboard-toast-title", text: "On your clipboard" }));
    inner.appendChild(
      el("p", {
        text: opts.copied
          ? "The newsletter webpage is copied. Paste it in Gmail Compose with Ctrl+V. Come back here later for the subject line."
          : "Preview opened — click Copy newsletter in that window, then paste in Gmail. Come back here later for the subject line.",
      }),
    );
    toast.appendChild(inner);
    var dismiss = el("button", {
      type: "button",
      class: "gmail-clipboard-toast-close",
      "aria-label": "Dismiss",
      text: "×",
    });
    inner.appendChild(dismiss);

    function close() {
      toast.classList.remove("is-visible");
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
      if (window.__vsaGmailToastTimer) {
        clearTimeout(window.__vsaGmailToastTimer);
        window.__vsaGmailToastTimer = null;
      }
    }
    dismiss.addEventListener("click", close);
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });
    window.__vsaGmailToastTimer = setTimeout(close, opts.ms || 8000);
  }

  /** @deprecated kept as alias for any leftover callers */
  function showGmailImportHelp(subject, opts) {
    showGmailClipboardToast(opts || {});
  }

  function openNewsletterCopyWindow(html, subject) {
    var w = window.open("", "_blank");
    if (!w) {
      return null;
    }
    var safeSubject = String(subject || "Auburn VSA newsletter")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    var subjectAttr = String(subject || "Auburn VSA newsletter")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
    var fragment = newsletterHtmlBodyFragment(html);
    w.document.open();
    w.document.write(
      "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>" +
        safeSubject +
        "</title>" +
        "<style>" +
        "body{margin:0;font-family:Be Vietnam Pro,Segoe UI,Helvetica Neue,Arial,sans-serif;background:#e8ecf3;color:#243447;}" +
        ".nl-copy-bar{position:sticky;top:0;z-index:9;background:#1a3560;color:#fff;padding:14px 16px;" +
        "border-bottom:3px solid #FF811D;box-shadow:0 8px 24px rgba(26,53,96,.18);}" +
        ".nl-copy-bar-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;}" +
        ".nl-copy-bar h1{margin:0;font-size:15px;font-weight:700;flex:1;min-width:10rem;}" +
        ".nl-copy-actions{display:flex;flex-wrap:wrap;gap:8px;}" +
        ".nl-btn{appearance:none;border:none;border-radius:8px;padding:10px 14px;font:inherit;font-size:14px;" +
        "font-weight:700;cursor:pointer;}" +
        ".nl-btn-primary{background:#FF811D;color:#fff;}" +
        ".nl-btn-primary:hover{filter:brightness(1.05);}" +
        ".nl-btn-primary.is-ok{background:#166534;}" +
        ".nl-btn-ghost{background:rgba(255,255,255,.14);color:#fff;}" +
        ".nl-btn-ghost:hover{background:rgba(255,255,255,.24);}" +
        ".nl-copy-status{margin:8px 0 0;font-size:13px;font-weight:600;opacity:.95;min-height:1.2em;}" +
        ".nl-copy-sub{margin:4px 0 0;font-size:12px;opacity:.82;}" +
        ".nl-copy-wrap{padding:20px 12px 48px;}" +
        "</style></head><body>" +
        "<div class=\"nl-copy-bar\">" +
        "<div class=\"nl-copy-bar-row\">" +
        "<h1>Ready to paste in Gmail</h1>" +
        "<div class=\"nl-copy-actions\">" +
        "<button type=\"button\" class=\"nl-btn nl-btn-primary\" id=\"nl-copy-btn\">Copy again</button>" +
        "<button type=\"button\" class=\"nl-btn nl-btn-ghost\" id=\"nl-gmail-btn\">Open Gmail</button>" +
        "</div></div>" +
        "<p class=\"nl-copy-sub\">Come back to the admin tab later for the subject line.</p>" +
        "<p class=\"nl-copy-status\" id=\"nl-copy-status\" role=\"status\">Paste in Gmail Compose with Ctrl+V.</p>" +
        "</div>" +
        "<div class=\"nl-copy-wrap\" id=\"nl-copy-target\" data-subject=\"" +
        subjectAttr +
        "\">" +
        fragment +
        "</div>" +
        "<script>" +
        "(function(){" +
        "var target=document.getElementById('nl-copy-target');" +
        "var copyBtn=document.getElementById('nl-copy-btn');" +
        "var gmailBtn=document.getElementById('nl-gmail-btn');" +
        "var status=document.getElementById('nl-copy-status');" +
        "function setStatus(t){if(status)status.textContent=t||'';}" +
        "function copyRich(){" +
        "var html=target?target.innerHTML:'';" +
        "var plain=target?(target.innerText||target.textContent||''):'';" +
        "if(navigator.clipboard&&window.ClipboardItem){" +
        "return navigator.clipboard.write([new ClipboardItem({" +
        "'text/html':new Blob([html],{type:'text/html'})," +
        "'text/plain':new Blob([plain],{type:'text/plain'})" +
        "})]);" +
        "}" +
        "return new Promise(function(resolve,reject){" +
        "try{" +
        "var range=document.createRange();range.selectNodeContents(target);" +
        "var sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);" +
        "var ok=document.execCommand('copy');sel.removeAllRanges();" +
        "if(ok)resolve();else reject(new Error('copy failed'));" +
        "}catch(e){reject(e);}" +
        "});" +
        "}" +
        "copyBtn.addEventListener('click',function(){" +
        "copyBtn.disabled=true;setStatus('Copying…');" +
        "copyRich().then(function(){" +
        "copyBtn.textContent='Copied!';copyBtn.classList.add('is-ok');" +
        "setStatus('On clipboard. Paste in Gmail with Ctrl+V. Subject is in the admin tab when you come back.');" +
        "setTimeout(function(){copyBtn.textContent='Copy again';copyBtn.classList.remove('is-ok');copyBtn.disabled=false;},2500);" +
        "}).catch(function(){" +
        "setStatus('Copy blocked — select the email below and press Ctrl+C');" +
        "copyBtn.disabled=false;" +
        "try{var r=document.createRange();r.selectNodeContents(target);var s=window.getSelection();s.removeAllRanges();s.addRange(r);}catch(e){}" +
        "});" +
        "});" +
        "gmailBtn.addEventListener('click',function(){" +
        "window.open('https://mail.google.com/mail/u/0/#inbox','_blank');" +
        "});" +
        "})();" +
        "<\/script>" +
        "</body></html>",
    );
    w.document.close();
    try {
      w.focus();
    } catch (err) {
      /* ignore */
    }
    return w;
  }

  function downloadBlob(filename, blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function newsletterComposeEditor(mount) {
    var wrap = el("div", { class: "admin-block newsletter-compose" });
    wrap.appendChild(el("h2", { class: "admin-block-title", text: "Monthly newsletter" }));
    wrap.appendChild(
      el("p", {
        class: "section-desc",
        text: "Pick or create a named draft, preview on the right, then Copy for Gmail. BCC subscribers in chunks below.",
      }),
    );

    var status = el("p", { class: "muted newsletter-compose-status", text: "Loading draft…" });
    wrap.appendChild(status);

    var library = el("div", { class: "newsletter-draft-library" });
    var libTop = el("div", { class: "newsletter-draft-library-row" });
    var pickBox = el("div", { class: "newsletter-draft-pick" });
    pickBox.appendChild(el("label", { text: "Draft", for: "nl-draft-pick" }));
    var draftSelect = el("select", { id: "nl-draft-pick", class: "newsletter-draft-select" });
    pickBox.appendChild(draftSelect);
    libTop.appendChild(pickBox);
    var nameBox = el("div", { class: "newsletter-draft-name" });
    nameBox.appendChild(el("label", { text: "Name", for: "nl-draft-name" }));
    var draftNameInput = el("input", {
      type: "text",
      id: "nl-draft-name",
      class: "newsletter-draft-name-input",
      placeholder: "e.g. July 2026",
      maxlength: "80",
    });
    nameBox.appendChild(draftNameInput);
    libTop.appendChild(nameBox);
    library.appendChild(libTop);
    var libActions = el("div", { class: "newsletter-draft-actions" });
    var newDraftBtn = el("button", { type: "button", class: "btn-ghost", text: "New" });
    var saveAsBtn = el("button", { type: "button", class: "btn-outline", text: "Save as new" });
    var dupDraftBtn = el("button", { type: "button", class: "btn-ghost", text: "Duplicate" });
    var delDraftBtn = el("button", { type: "button", class: "btn-ghost link-danger", text: "Delete" });
    [newDraftBtn, saveAsBtn, dupDraftBtn, delDraftBtn].forEach(function (b) {
      libActions.appendChild(b);
    });
    library.appendChild(libActions);
    library.appendChild(
      el("p", {
        class: "muted newsletter-draft-hint",
        text: "Save named drafts for each month. Switch anytime — your library stays on the server (up to 40).",
      }),
    );
    wrap.appendChild(library);

    var layout = el("div", { class: "newsletter-compose-layout" });
    var formCol = el("div", { class: "newsletter-compose-form" });
    var previewCol = el("div", { class: "newsletter-compose-preview-col" });
    layout.appendChild(formCol);
    layout.appendChild(previewCol);
    wrap.appendChild(layout);
    mount.appendChild(wrap);

    var draft = null;
    var activeDraftId = "";
    var draftsList = [];
    var htmlCache = "";
    var plainCache = "";
    var fields = {};
    var itemsHost = null;
    var heroImageValue = "";
    var suppressDraftSelect = false;

    function sectionHead(text, hint) {
      formCol.appendChild(el("h3", { class: "newsletter-compose-subhead", text: text }));
      if (hint) {
        formCol.appendChild(el("p", { class: "muted newsletter-compose-section-hint", text: hint }));
      }
    }

    function field(labelText, key, type) {
      var box = el("div", { class: "field" });
      box.appendChild(el("label", { text: labelText, for: "nl-" + key }));
      var input =
        type === "textarea"
          ? el("textarea", { id: "nl-" + key, rows: key === "intro" || key === "closing" ? "4" : "2" })
          : el("input", { type: "text", id: "nl-" + key });
      fields[key] = input;
      input.addEventListener("input", schedulePreview);
      box.appendChild(input);
      formCol.appendChild(box);
      return input;
    }

    sectionHead(
      "Opening",
      "Subject is the bold title in the inbox. Preheader is the short gray line under it — one polished sentence (~90 characters), not a repeat of the subject.",
    );
    field("Subject", "subject", "text");
    field("Preheader (inbox preview)", "preheader", "text");
    field("Headline", "headline", "text");
    field("Intro", "intro", "textarea");

    var heroBox = el("div", { class: "field" });
    heroBox.appendChild(el("label", { text: "Hero photo (optional, under the opening)" }));
    heroBox.appendChild(
      imageControl(
        function () {
          return heroImageValue;
        },
        function (v) {
          heroImageValue = v || "";
          schedulePreview();
        },
        { cropAspect: "16:9", skipAdjust: false },
      ),
    );
    formCol.appendChild(heroBox);

    sectionHead(
      "Events / updates",
      "Optional photo above each item, then title, date/place, and a short blurb.",
    );
    itemsHost = el("div", { class: "newsletter-compose-items" });
    formCol.appendChild(itemsHost);
    var addItemBtn = el("button", {
      type: "button",
      class: "btn-ghost",
      text: "Add event",
    });
    var pullEventsBtn = el("button", {
      type: "button",
      class: "btn-outline",
      text: "Add from Events",
      title: "Pull upcoming events from the Events CMS into this draft",
    });
    var itemActions = el("div", { class: "imgctl-actions newsletter-item-actions" });
    itemActions.appendChild(addItemBtn);
    itemActions.appendChild(pullEventsBtn);
    formCol.appendChild(itemActions);

    sectionHead("Call to action", "Optional button after the events.");
    field("CTA button label", "ctaLabel", "text");
    field("CTA button URL", "ctaUrl", "text");

    sectionHead(
      "Sign-off (bottom of email only)",
      "Closing + name appear after events — not in the header.",
    );
    field("Closing", "closing", "textarea");
    field("Sign-off", "signoff", "text");

    var actions = el("div", { class: "imgctl-actions newsletter-compose-actions" });
    var saveBtn = el("button", { type: "button", class: "btn btn-orange sm", text: "Save" });
    var gmailBtn = el("button", {
      type: "button",
      class: "btn btn-orange sm",
      text: "Copy for Gmail",
    });
    var moreActions = el("details", { class: "newsletter-compose-more" });
    moreActions.appendChild(el("summary", { text: "More export options" }));
    var moreInner = el("div", { class: "imgctl-actions newsletter-compose-more-actions" });
    var openCopyBtn = el("button", {
      type: "button",
      class: "btn-ghost",
      text: "Open copy window",
    });
    var copyPlainBtn = el("button", { type: "button", class: "btn-ghost", text: "Copy plain text" });
    var copyHtmlSrcBtn = el("button", {
      type: "button",
      class: "btn-ghost",
      text: "Copy HTML source",
    });
    var dlHtmlBtn = el("button", { type: "button", class: "btn-ghost", text: "Download .html" });
    var dlTxtBtn = el("button", { type: "button", class: "btn-ghost", text: "Download .txt" });
    [openCopyBtn, copyPlainBtn, copyHtmlSrcBtn, dlHtmlBtn, dlTxtBtn].forEach(function (b) {
      moreInner.appendChild(b);
    });
    moreActions.appendChild(moreInner);
    actions.appendChild(saveBtn);
    actions.appendChild(gmailBtn);
    actions.appendChild(moreActions);
    formCol.appendChild(actions);

    var how = el("p", {
      class: "muted newsletter-compose-how",
      text:
        "Gmail cannot receive HTML via a link. Copy for Gmail opens a preview (Ctrl+C), then open Gmail → Compose → Ctrl+V. Photos need to be on the live public site.",
    });
    formCol.appendChild(how);

    previewCol.appendChild(el("h3", { class: "newsletter-compose-subhead", text: "Preview" }));
    var iframe = el("iframe", {
      class: "newsletter-compose-iframe",
      title: "Newsletter preview",
    });
    previewCol.appendChild(iframe);

    var previewTimer = 0;
    var previewSeq = 0;
    function schedulePreview() {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(refreshPreview, 280);
    }

    function paintDraftPicker(list, activeId) {
      draftsList = Array.isArray(list) ? list : [];
      activeDraftId = activeId || activeDraftId || "";
      suppressDraftSelect = true;
      draftSelect.innerHTML = "";
      if (!draftsList.length) {
        var emptyOpt = el("option", { value: "", text: "No drafts yet" });
        draftSelect.appendChild(emptyOpt);
      } else {
        draftsList.forEach(function (row) {
          var id = String((row && row.id) || "");
          if (!id) return;
          var label = String((row && row.name) || "Untitled");
          var when = row && row.updatedAt ? " · " + formatInboxDate(row.updatedAt) : "";
          var opt = el("option", { value: id, text: label + when });
          if (id === activeDraftId) opt.selected = true;
          draftSelect.appendChild(opt);
        });
      }
      draftSelect.value = activeDraftId || draftSelect.value;
      suppressDraftSelect = false;
    }

    function applyServerPayload(data, statusMsg) {
      if (!data) return;
      paintDraftPicker(data.drafts || [], data.activeId || (data.draft && data.draft.id) || "");
      applyDraft(data.draft || {});
      setPreview(data.html, data.plain);
      if (statusMsg) {
        status.className = "muted";
        status.textContent = statusMsg;
      }
    }

    function readItemRow(row) {
      return {
        title: (row.querySelector('[data-k="title"]') || {}).value || "",
        when: (row.querySelector('[data-k="when"]') || {}).value || "",
        where: (row.querySelector('[data-k="where"]') || {}).value || "",
        blurb: (row.querySelector('[data-k="blurb"]') || {}).value || "",
        link: (row.querySelector('[data-k="link"]') || {}).value || "",
        image: (row.querySelector('[data-k="image"]') || {}).value || "",
      };
    }

    function collectDraft() {
      var items = [];
      Array.prototype.forEach.call(itemsHost.querySelectorAll(".newsletter-item-row"), function (row) {
        items.push(readItemRow(row));
      });
      return {
        id: activeDraftId || "",
        name: (draftNameInput.value || "").trim(),
        subject: fields.subject.value,
        preheader: fields.preheader.value,
        headline: fields.headline.value,
        intro: fields.intro.value,
        heroImage: heroImageValue || "",
        items: items,
        ctaLabel: fields.ctaLabel.value,
        ctaUrl: fields.ctaUrl.value,
        closing: fields.closing.value,
        signoff: fields.signoff.value,
      };
    }

    function paintItem(item, index) {
      item = item || {};
      var row = el("div", { class: "newsletter-item-row" });
      row.appendChild(el("p", { class: "newsletter-item-label", text: "Event " + (index + 1) }));

      var imgHidden = el("input", { type: "hidden", "data-k": "image" });
      imgHidden.value = item.image || "";
      row.appendChild(imgHidden);
      var imgField = el("div", { class: "field" });
      imgField.appendChild(
        el("label", { text: "Divider photo (full-width above this event)" }),
      );
      imgField.appendChild(
        imageControl(
          function () {
            return imgHidden.value;
          },
          function (v) {
            imgHidden.value = v || "";
            schedulePreview();
          },
          { cropAspect: "16:9", skipAdjust: false },
        ),
      );
      row.appendChild(imgField);

      ["title", "when", "where", "link"].forEach(function (k) {
        var labels = { title: "Title", when: "When", where: "Where", link: "Link (optional)" };
        var box = el("div", { class: "field" });
        box.appendChild(el("label", { text: labels[k] }));
        var input = el("input", { type: "text", "data-k": k });
        input.value = item[k] || "";
        input.addEventListener("input", schedulePreview);
        box.appendChild(input);
        row.appendChild(box);
      });
      var blurbBox = el("div", { class: "field" });
      blurbBox.appendChild(el("label", { text: "Blurb" }));
      var blurb = el("textarea", { "data-k": "blurb", rows: "2" });
      blurb.value = item.blurb || "";
      blurb.addEventListener("input", schedulePreview);
      blurbBox.appendChild(blurb);
      row.appendChild(blurbBox);
      var rm = el("button", { type: "button", class: "link-danger", text: "Remove event" });
      rm.addEventListener("click", function () {
        var rows = itemsHost.querySelectorAll(".newsletter-item-row");
        if (rows.length <= 1) {
          // Keep one blank row so the form never has zero events.
          row.remove();
          paintItem({}, 0);
          schedulePreview();
          return;
        }
        row.remove();
        renumberItems();
        schedulePreview();
      });
      row.appendChild(rm);
      itemsHost.appendChild(row);
    }

    function renumberItems() {
      Array.prototype.forEach.call(itemsHost.querySelectorAll(".newsletter-item-row"), function (row, i) {
        var lab = row.querySelector(".newsletter-item-label");
        if (lab) lab.textContent = "Event " + (i + 1);
      });
    }

    function applyDraft(d) {
      draft = d || {};
      activeDraftId = String(draft.id || activeDraftId || "");
      draftNameInput.value = draft.name || "";
      fields.subject.value = draft.subject || "";
      fields.preheader.value = draft.preheader || "";
      fields.headline.value = draft.headline || "";
      fields.intro.value = draft.intro || "";
      fields.ctaLabel.value = draft.ctaLabel || "";
      fields.ctaUrl.value = draft.ctaUrl || "";
      fields.closing.value = draft.closing || "";
      fields.signoff.value = draft.signoff || "";
      heroImageValue = draft.heroImage || "";
      var oldHero = heroBox.querySelector(".imgctl");
      if (oldHero) oldHero.remove();
      heroBox.appendChild(
        imageControl(
          function () {
            return heroImageValue;
          },
          function (v) {
            heroImageValue = v || "";
            schedulePreview();
          },
          { cropAspect: "16:9", skipAdjust: false },
        ),
      );
      itemsHost.innerHTML = "";
      var items = Array.isArray(draft.items) && draft.items.length ? draft.items : [{}];
      items.forEach(function (it, i) {
        paintItem(it, i);
      });
    }

    function setPreview(html, plain) {
      htmlCache = html || "";
      plainCache = plain || "";
      try {
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(htmlCache);
        doc.close();
      } catch (err) {
        /* ignore */
      }
    }

    function refreshPreview() {
      var seq = ++previewSeq;
      newsletterComposeRequest("POST", { action: "preview", draft: collectDraft(), forEmail: false })
        .then(function (data) {
          if (seq !== previewSeq) return;
          setPreview(data.html, data.plain);
        })
        .catch(function () {
          /* keep last preview */
        });
    }

    /** Gmail-ready HTML/plain from the current form (public image URLs; not the last saved file). */
    function exportForEmail() {
      return newsletterComposeRequest("POST", {
        action: "preview",
        draft: collectDraft(),
        forEmail: true,
      });
    }

    addItemBtn.addEventListener("click", function () {
      paintItem({}, itemsHost.querySelectorAll(".newsletter-item-row").length);
      schedulePreview();
    });

    pullEventsBtn.addEventListener("click", function () {
      var upcoming = (content.events && content.events.upcoming) || [];
      if (!Array.isArray(upcoming) || !upcoming.length) {
        status.className = "save-status err";
        status.textContent = "No upcoming events in Events CMS yet. Add some under Events, then try again.";
        return;
      }
      var mapped = upcoming
        .filter(function (ev) {
          return ev && typeof ev === "object" && itemIsVisible(ev);
        })
        .map(function (ev) {
          return {
            title: String(ev.name || "").trim(),
            when: String(ev.date || "").trim(),
            where: String(ev.location || "").trim(),
            blurb: String(ev.description || "").trim(),
            link: String(ev.link || "").trim(),
            image: String(ev.image || "").trim(),
          };
        })
        .filter(function (row) {
          return row.title || row.when || row.where || row.blurb || row.link || row.image;
        });
      if (!mapped.length) {
        status.className = "save-status err";
        status.textContent = "Upcoming events are hidden or empty. Check Events → Upcoming.";
        return;
      }
      var existing = [];
      Array.prototype.forEach.call(itemsHost.querySelectorAll(".newsletter-item-row"), function (row) {
        existing.push(readItemRow(row));
      });
      var existingIsBlank =
        existing.length === 0 ||
        (existing.length === 1 &&
          !existing[0].title &&
          !existing[0].when &&
          !existing[0].where &&
          !existing[0].blurb &&
          !existing[0].link &&
          !existing[0].image);
      var mode = "append";
      if (!existingIsBlank) {
        var choice = confirm(
          "Add " +
            mapped.length +
            " upcoming event(s) from the Events page?\n\nOK = append to current draft\nCancel = stop",
        );
        if (!choice) return;
      } else {
        mode = "replace";
      }
      if (mode === "replace") {
        itemsHost.innerHTML = "";
      }
      // Deduplicate by title+when against existing rows.
      var seen = {};
      Array.prototype.forEach.call(itemsHost.querySelectorAll(".newsletter-item-row"), function (row) {
        var cur = readItemRow(row);
        seen[(cur.title + "|" + cur.when).toLowerCase()] = true;
      });
      var added = 0;
      mapped.forEach(function (row) {
        var key = (row.title + "|" + row.when).toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        paintItem(row, itemsHost.querySelectorAll(".newsletter-item-row").length);
        added++;
      });
      renumberItems();
      schedulePreview();
      status.className = "save-status ok";
      status.textContent =
        added > 0
          ? "Added " + added + " event" + (added === 1 ? "" : "s") + " from Events. Review, then Save."
          : "Those events are already in the draft.";
    });

    function runDraftAction(action, body, pendingText) {
      status.className = "save-status pending";
      status.textContent = pendingText || "Working…";
      return newsletterComposeRequest("POST", Object.assign({ action: action }, body || {}));
    }

    saveBtn.addEventListener("click", function () {
      saveBtn.disabled = true;
      var payload = collectDraft();
      runDraftAction(
        "save",
        { id: activeDraftId, name: payload.name, draft: payload },
        "Saving…",
      )
        .then(function (data) {
          applyServerPayload(
            data,
            data.draft && data.draft.updatedAt
              ? 'Saved "' + (data.draft.name || "draft") + '" · ' + formatInboxDate(data.draft.updatedAt)
              : "Saved.",
          );
          status.className = "save-status ok";
        })
        .catch(function (err) {
          status.className = "save-status err";
          status.textContent = (err && err.message) || "Could not save draft.";
        })
        .then(function () {
          saveBtn.disabled = false;
        });
    });

    draftSelect.addEventListener("change", function () {
      if (suppressDraftSelect) return;
      var nextId = draftSelect.value;
      if (!nextId || nextId === activeDraftId) return;
      draftSelect.disabled = true;
      runDraftAction("select", { id: nextId }, "Opening draft…")
        .then(function (data) {
          applyServerPayload(
            data,
            data.draft && data.draft.name
              ? 'Opened "' + data.draft.name + '".'
              : "Draft opened.",
          );
        })
        .catch(function (err) {
          status.className = "save-status err";
          status.textContent = (err && err.message) || "Could not open draft.";
          paintDraftPicker(draftsList, activeDraftId);
        })
        .then(function () {
          draftSelect.disabled = false;
        });
    });

    newDraftBtn.addEventListener("click", function () {
      var name = window.prompt(
        "Name for the new draft",
        "Newsletter — " + new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
      );
      if (name === null) return;
      newDraftBtn.disabled = true;
      runDraftAction("create", { name: String(name || "").trim() }, "Creating draft…")
        .then(function (data) {
          applyServerPayload(data, 'Created "' + ((data.draft && data.draft.name) || "draft") + '".');
          status.className = "save-status ok";
        })
        .catch(function (err) {
          status.className = "save-status err";
          status.textContent = (err && err.message) || "Could not create draft.";
        })
        .then(function () {
          newDraftBtn.disabled = false;
        });
    });

    saveAsBtn.addEventListener("click", function () {
      var suggested = (draftNameInput.value || "").trim();
      if (suggested) suggested += " (copy)";
      else suggested = "Newsletter — " + new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
      var name = window.prompt("Save current content as a new named draft", suggested);
      if (name === null) return;
      saveAsBtn.disabled = true;
      runDraftAction(
        "save_as",
        { name: String(name || "").trim(), draft: collectDraft() },
        "Saving as new draft…",
      )
        .then(function (data) {
          applyServerPayload(data, 'Saved as "' + ((data.draft && data.draft.name) || "draft") + '".');
          status.className = "save-status ok";
        })
        .catch(function (err) {
          status.className = "save-status err";
          status.textContent = (err && err.message) || "Could not save as new draft.";
        })
        .then(function () {
          saveAsBtn.disabled = false;
        });
    });

    dupDraftBtn.addEventListener("click", function () {
      if (!activeDraftId) return;
      var suggested = ((draftNameInput.value || "").trim() || "Draft") + " (copy)";
      var name = window.prompt("Duplicate draft as", suggested);
      if (name === null) return;
      dupDraftBtn.disabled = true;
      runDraftAction("duplicate", { id: activeDraftId, name: String(name || "").trim() }, "Duplicating…")
        .then(function (data) {
          applyServerPayload(data, 'Duplicated as "' + ((data.draft && data.draft.name) || "draft") + '".');
          status.className = "save-status ok";
        })
        .catch(function (err) {
          status.className = "save-status err";
          status.textContent = (err && err.message) || "Could not duplicate draft.";
        })
        .then(function () {
          dupDraftBtn.disabled = false;
        });
    });

    delDraftBtn.addEventListener("click", function () {
      if (!activeDraftId) return;
      var label = (draftNameInput.value || "").trim() || "this draft";
      if (!confirm('Delete "' + label + '"? This cannot be undone.')) return;
      delDraftBtn.disabled = true;
      runDraftAction("delete", { id: activeDraftId }, "Deleting…")
        .then(function (data) {
          applyServerPayload(data, 'Draft deleted. Showing "' + ((data.draft && data.draft.name) || "draft") + '".');
          status.className = "save-status ok";
        })
        .catch(function (err) {
          status.className = "save-status err";
          status.textContent = (err && err.message) || "Could not delete draft.";
        })
        .then(function () {
          delDraftBtn.disabled = false;
        });
    });

    copyPlainBtn.addEventListener("click", function () {
      copyPlainBtn.disabled = true;
      exportForEmail()
        .then(function (data) {
          return copyTextToClipboard(data.plain || "", copyPlainBtn);
        })
        .catch(function () {
          alert("Could not build plain text.");
        })
        .then(function () {
          copyPlainBtn.disabled = false;
        });
    });
    copyHtmlSrcBtn.addEventListener("click", function () {
      copyHtmlSrcBtn.disabled = true;
      exportForEmail()
        .then(function (data) {
          return copyTextToClipboard(data.html || "", copyHtmlSrcBtn, "Source copied");
        })
        .catch(function () {
          alert("Could not build HTML source.");
        })
        .then(function () {
          copyHtmlSrcBtn.disabled = false;
        });
    });
    dlHtmlBtn.addEventListener("click", function () {
      dlHtmlBtn.disabled = true;
      exportForEmail()
        .then(function (data) {
          downloadBlob(
            "vsa-newsletter-" + new Date().toISOString().slice(0, 7) + ".html",
            new Blob([data.html || ""], { type: "text/html;charset=utf-8" }),
          );
        })
        .catch(function () {
          alert("Could not download HTML.");
        })
        .then(function () {
          dlHtmlBtn.disabled = false;
        });
    });
    dlTxtBtn.addEventListener("click", function () {
      dlTxtBtn.disabled = true;
      exportForEmail()
        .then(function (data) {
          downloadBlob(
            "vsa-newsletter-" + new Date().toISOString().slice(0, 7) + ".txt",
            new Blob([data.plain || ""], { type: "text/plain;charset=utf-8" }),
          );
        })
        .catch(function () {
          alert("Could not download plain text.");
        })
        .then(function () {
          dlTxtBtn.disabled = false;
        });
    });
    gmailBtn.addEventListener("click", function () {
      gmailBtn.disabled = true;
      status.className = "save-status pending";
      status.textContent = "Preparing Gmail copy…";
      exportForEmail()
        .then(function (data) {
          var d = collectDraft();
          var subject = d.subject || "Auburn VSA newsletter";
          var copyWin = openNewsletterCopyWindow(data.html || "", subject);
          if (!copyWin) {
            throw new Error("Pop-up blocked. Allow pop-ups for this site, then try again.");
          }
          return copyRichEmailToClipboard(data.html || "", data.plain || "")
            .then(function () {
              return { copied: true, subject: subject };
            })
            .catch(function () {
              return { copied: false, subject: subject };
            });
        })
        .then(function (result) {
          showGmailClipboardToast({ copied: !!result.copied });
          status.className = "save-status ok";
          status.textContent = result.copied
            ? "Newsletter on clipboard. Come back later for the subject line."
            : "Preview opened — use Copy newsletter there. Come back later for the subject line.";
          gmailBtn.textContent = "Ready — paste in Gmail";
          setTimeout(function () {
            gmailBtn.textContent = "Copy for Gmail";
          }, 3200);
        })
        .catch(function (err) {
          status.className = "save-status err";
          status.textContent = (err && err.message) || "Could not prepare Gmail copy.";
          alert(status.textContent);
        })
        .then(function () {
          gmailBtn.disabled = false;
        });
    });
    openCopyBtn.addEventListener("click", function () {
      openCopyBtn.disabled = true;
      exportForEmail()
        .then(function (data) {
          var d = collectDraft();
          var subject = d.subject || "Auburn VSA newsletter";
          var copyWin = openNewsletterCopyWindow(data.html || "", subject);
          if (!copyWin) {
            throw new Error("Pop-up blocked. Allow pop-ups for this site, then try again.");
          }
          showGmailClipboardToast({ copied: false });
          status.className = "save-status ok";
          status.textContent =
            "Preview opened — use Copy newsletter there. Come back later for the subject line.";
        })
        .catch(function (err) {
          alert((err && err.message) || "Could not open copy window.");
        })
        .then(function () {
          openCopyBtn.disabled = false;
        });
    });

    newsletterComposeRequest("GET")
      .then(function (data) {
        var msg =
          data.draft && data.draft.name
            ? 'Loaded "' +
              data.draft.name +
              '"' +
              (data.draft.updatedAt ? " · saved " + formatInboxDate(data.draft.updatedAt) : "") +
              "."
            : "Draft loaded.";
        applyServerPayload(data, msg);
      })
      .catch(function (err) {
        status.className = "error";
        status.textContent = (err && err.message) || "Could not load draft.";
        applyDraft({});
      });
  }

  /** Pending public unsubscribe requests — mounted at top of Newsletter tab. */
  function unsubRequestsEditor(mount) {
    var wrap = el("div", { class: "admin-block newsletter-unsub-requests" });
    var titleRow = el("div", { class: "newsletter-unsub-head" });
    titleRow.appendChild(el("h2", { class: "admin-block-title", text: "Pending unsubscribe requests" }));
    var refreshBtn = el("button", { type: "button", class: "btn-ghost", text: "Refresh" });
    titleRow.appendChild(refreshBtn);
    wrap.appendChild(titleRow);
    wrap.appendChild(
      el("p", {
        class: "section-desc",
        text: "From /unsubscribe (email form). Approve removes them from the list. Token links in CSV still unsubscribe immediately.",
      }),
    );
    var reqStatus = el("p", { class: "muted", text: "Loading…" });
    var reqList = el("div", { class: "faq-inbox-list subscriber-list" });
    wrap.appendChild(reqStatus);
    wrap.appendChild(reqList);
    mount.appendChild(wrap);

    function paintRequests(requests) {
      requests = Array.isArray(requests) ? requests : [];
      reqList.innerHTML = "";
      wrap.classList.toggle("has-pending", requests.length > 0);
      unsubPendingCount = requests.length;
      renderNav();
      reqStatus.className = "muted";
      if (!requests.length) {
        reqStatus.textContent = "No pending unsubscribe requests.";
        return;
      }
      reqStatus.textContent =
        requests.length +
        " pending request" +
        (requests.length === 1 ? "" : "s") +
        " — Approve to remove from the newsletter list.";
      requests.forEach(function (item) {
        var id = item && item.id != null ? String(item.id) : "";
        if (!id) return;
        var row = el("div", { class: "subscriber-row" });
        var meta = el("div", { class: "subscriber-meta" });
        meta.appendChild(el("strong", { text: (item && item.email) || "" }));
        var bits = [];
        if (item.ts) bits.push(formatInboxDate(item.ts));
        if (item.ip) bits.push("IP " + item.ip);
        if (bits.length) {
          meta.appendChild(el("p", { class: "muted", text: bits.join(" · ") }));
        }
        row.appendChild(meta);
        var actionsRow = el("div", { class: "subscriber-actions" });
        var approve = el("button", { type: "button", class: "btn btn-orange sm", text: "Approve" });
        var dismiss = el("button", { type: "button", class: "btn-ghost", text: "Dismiss" });
        approve.addEventListener("click", function () {
          if (!confirm("Remove " + ((item && item.email) || "this email") + " from the newsletter list?")) return;
          approve.disabled = true;
          dismiss.disabled = true;
          subscribersRequest("POST", { action: "approve_unsub", id: id })
            .then(function (data) {
              paintRequests(data.unsubRequests || []);
              if (typeof window.__vsaRefreshSubscribers === "function") {
                window.__vsaRefreshSubscribers(data.items || []);
              }
            })
            .catch(function (e) {
              approve.disabled = false;
              dismiss.disabled = false;
              alert((e && e.message) || "Could not approve.");
            });
        });
        dismiss.addEventListener("click", function () {
          dismiss.disabled = true;
          approve.disabled = true;
          subscribersRequest("POST", { action: "dismiss_unsub", id: id })
            .then(function (data) {
              paintRequests(data.unsubRequests || []);
            })
            .catch(function (e) {
              dismiss.disabled = false;
              approve.disabled = false;
              alert((e && e.message) || "Could not dismiss.");
            });
        });
        actionsRow.appendChild(approve);
        actionsRow.appendChild(dismiss);
        row.appendChild(actionsRow);
        reqList.appendChild(row);
      });
    }

    function loadRequests() {
      reqStatus.className = "muted";
      reqStatus.textContent = "Loading…";
      subscribersRequest("GET")
        .then(function (data) {
          paintRequests(data.unsubRequests || []);
        })
        .catch(function (e) {
          reqStatus.className = "error";
          reqStatus.textContent = (e && e.message) || "Could not load unsubscribe requests.";
        });
    }

    refreshBtn.addEventListener("click", loadRequests);
    window.__vsaRefreshUnsubRequests = paintRequests;
    loadRequests();
  }

  function subscribersEditor(mount) {
    var wrap = el("div", { class: "admin-block" });
    wrap.appendChild(el("h2", { class: "admin-block-title", text: "Newsletter subscribers" }));
    wrap.appendChild(
      el("p", {
        class: "section-desc",
        text: "People who signed up via the footer form. CSV / BCC for Gmail.",
      }),
    );

    var actions = el("div", { class: "imgctl-actions" });
    var download = el("button", { type: "button", class: "btn btn-orange sm", text: "Download CSV" });
    download.addEventListener("click", function () {
      fetch("subscribers.php?format=csv", {
        headers: { "X-CSRF-Token": window.CSRF_TOKEN },
      })
        .then(function (r) {
          if (!r.ok) throw new Error("Download failed");
          return r.blob();
        })
        .then(function (blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = "vsa-newsletter-subscribers.csv";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        })
        .catch(function () {
          alert("Could not download subscribers.");
        });
    });
    var copyBtn = el("button", { type: "button", class: "btn-ghost", text: "Copy all emails" });
    var copyBccBtn = el("button", { type: "button", class: "btn-ghost", text: "Copy BCC chunk" });
    actions.appendChild(download);
    actions.appendChild(copyBtn);
    actions.appendChild(copyBccBtn);
    wrap.appendChild(actions);
    var bccHint = el("p", {
      class: "muted",
      text: "BCC chunk copies the next ~80 emails (Gmail-friendly). Click again for the next batch.",
    });
    wrap.appendChild(bccHint);
    var status = el("p", { class: "muted", text: "Loading…" });
    var list = el("div", { class: "faq-inbox-list subscriber-list" });
    wrap.appendChild(status);
    wrap.appendChild(list);
    mount.appendChild(wrap);

    var emailsCache = [];
    var bccOffset = 0;
    var BCC_CHUNK = 80;
    copyBtn.addEventListener("click", function () {
      if (!emailsCache.length) return;
      var text = emailsCache.join(", ");
      copyTextToClipboard(text, copyBtn);
    });
    copyBccBtn.addEventListener("click", function () {
      if (!emailsCache.length) return;
      if (bccOffset >= emailsCache.length) bccOffset = 0;
      var slice = emailsCache.slice(bccOffset, bccOffset + BCC_CHUNK);
      bccOffset += slice.length;
      var label =
        "Copy BCC chunk (" +
        (bccOffset - slice.length + 1) +
        "–" +
        bccOffset +
        " of " +
        emailsCache.length +
        ")";
      copyBccBtn.textContent = label;
      copyTextToClipboard(slice.join(", "), copyBccBtn, "Copied chunk!");
      setTimeout(function () {
        copyBccBtn.textContent =
          bccOffset >= emailsCache.length
            ? "Copy BCC chunk (restart)"
            : "Copy BCC chunk (next)";
      }, 1600);
    });

    function paint(items) {
      emailsCache = (items || []).map(function (i) {
        return i.email;
      });
      status.className = "muted";
      status.textContent = items.length
        ? items.length + " subscriber" + (items.length === 1 ? "" : "s")
        : "No subscribers yet.";
      list.innerHTML = "";
      items.forEach(function (item) {
        var row = el("div", { class: "subscriber-row" });
        var meta = el("div", { class: "subscriber-meta" });
        meta.appendChild(el("strong", { text: item.email || "" }));
        if (item.at) {
          meta.appendChild(el("p", { class: "muted", text: formatInboxDate(item.at) }));
        }
        row.appendChild(meta);
        var actionsRow = el("div", { class: "subscriber-actions" });
        if (item.unsubUrl) {
          var copyLink = el("button", { type: "button", class: "btn-ghost", text: "Copy unsub link" });
          copyLink.addEventListener("click", function () {
            copyTextToClipboard(item.unsubUrl, copyLink);
          });
          actionsRow.appendChild(copyLink);
        }
        var remove = el("button", { type: "button", class: "link-danger", text: "Remove" });
        remove.addEventListener("click", function () {
          if (!confirm("Remove " + (item.email || "this email") + " from the newsletter list?")) return;
          remove.disabled = true;
          subscribersRequest("POST", { action: "remove", email: item.email })
            .then(function (data) {
              paint(data.items || []);
              if (typeof window.__vsaRefreshUnsubRequests === "function") {
                window.__vsaRefreshUnsubRequests(data.unsubRequests || []);
              }
            })
            .catch(function (e) {
              remove.disabled = false;
              alert(e.message || "Could not remove subscriber.");
            });
        });
        actionsRow.appendChild(remove);
        row.appendChild(actionsRow);
        list.appendChild(row);
      });
    }

    window.__vsaRefreshSubscribers = paint;

    subscribersRequest("GET")
      .then(function (data) {
        paint(data.items || []);
        if (typeof window.__vsaRefreshUnsubRequests === "function") {
          window.__vsaRefreshUnsubRequests(data.unsubRequests || []);
        }
      })
      .catch(function () {
        status.textContent = "Could not load subscribers.";
        status.className = "error";
      });
  }

  function faqInboxRequest(method, body) {
    var opts = {
      method: method,
      headers: { "X-CSRF-Token": window.CSRF_TOKEN },
    };
    if (body) {
      opts.headers["content-type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch("faq-inbox.php", opts).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok || !data || !data.ok) {
          throw new Error((data && data.error) || "Request failed");
        }
        return data;
      });
    });
  }

  function formatInboxDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function faqInboxEditor(mount) {
    var wrap = el("div", { class: "admin-block faq-inbox-block" });
    wrap.appendChild(el("h2", { class: "admin-block-title", text: "Submitted questions" }));
    wrap.appendChild(
      el("p", {
        class: "section-desc",
        text: "Answer each ask, then publish to the public FAQs page (ASAP or scheduled). Dismiss removes it without publishing.",
      }),
    );
    var list = el("div", { class: "faq-inbox-list" });
    var status = el("p", { class: "muted faq-inbox-status", text: "Loading…" });
    wrap.appendChild(status);
    wrap.appendChild(list);
    mount.appendChild(wrap);

    function paint(items) {
      list.innerHTML = "";
      faqInboxCount = items.length;
      renderNav();
      if (!items.length) {
        status.textContent = "Inbox clear — no pending questions.";
        status.className = "muted faq-inbox-status is-empty";
        return;
      }
      status.textContent = items.length + " waiting for review";
      status.className = "faq-inbox-status has-items";

      items.forEach(function (item) {
        var card = el("div", { class: "faq-inbox-card" });
        var meta = el("div", { class: "faq-inbox-meta" });
        meta.appendChild(el("span", { text: formatInboxDate(item.createdAt) }));
        var who = [];
        if (item.name) who.push(item.name);
        if (item.email) who.push(item.email);
        if (who.length) meta.appendChild(el("span", { text: who.join(" · ") }));
        card.appendChild(meta);

        card.appendChild(el("label", { text: "Question" }));
        var qInput = el("textarea", { rows: "2" });
        qInput.value = item.question || "";
        card.appendChild(qInput);

        card.appendChild(el("label", { text: "Your answer" }));
        var aInput = el("textarea", {
          rows: "4",
          placeholder: "Write the answer that will appear on the FAQs page…",
        });
        var draftKey = "vsa-faq-draft-" + (item.id || "");
        try {
          var saved = sessionStorage.getItem(draftKey);
          if (saved) aInput.value = saved;
        } catch (e) {}
        aInput.addEventListener("input", function () {
          try {
            sessionStorage.setItem(draftKey, aInput.value);
          } catch (err) {}
        });
        card.appendChild(aInput);

        var actions = el("div", { class: "faq-inbox-actions" });
        var err = el("p", { class: "error faq-inbox-err hidden" });
        var ok = el("p", { class: "save-status ok faq-inbox-ok hidden" });
        var publish = el("button", {
          type: "button",
          class: "btn btn-orange sm",
          text: userCan("faqs") ? "Answer & publish" : "Need FAQs permission",
        });
        publish.disabled = !userCan("faqs");
        var dismiss = el("button", { type: "button", class: "link-danger", text: "Dismiss" });

        publish.addEventListener("click", function () {
          err.classList.add("hidden");
          ok.classList.add("hidden");
          var question = qInput.value.trim();
          var answer = aInput.value.trim();
          if (!question || !answer) {
            err.textContent = "Question and answer are required.";
            err.classList.remove("hidden");
            aInput.focus();
            return;
          }
          openPublishDialog()
            .then(function (pub) {
              publish.disabled = true;
              dismiss.disabled = true;
              if (pub.mode === "schedule") {
                var nextFaqs = (Array.isArray(content.faqs) ? content.faqs.slice() : []).concat([
                  { question: question, answer: answer, visible: "yes" },
                ]);
                return fetch("publish.php", {
                  method: "POST",
                  headers: {
                    "content-type": "application/json",
                    "X-CSRF-Token": window.CSRF_TOKEN || "",
                  },
                  credentials: "same-origin",
                  body: JSON.stringify({
                    action: "enqueue",
                    page: "faqs",
                    at: pub.at,
                    sections: { faqs: nextFaqs },
                    csrf: window.CSRF_TOKEN || "",
                  }),
                  cache: "no-store",
                })
                  .then(function (r) {
                    return r.json().then(function (data) {
                      if (!r.ok || !data || !data.ok) {
                        throw new Error((data && data.error) || "Schedule failed.");
                      }
                      return data;
                    });
                  })
                  .then(function (data) {
                    if (Array.isArray(data.pending)) window.PUBLISH_PENDING = data.pending;
                    return faqInboxRequest("POST", { action: "dismiss", id: item.id }).then(function () {
                      return data;
                    });
                  })
                  .then(function (data) {
                    content.faqs = nextFaqs;
                    try {
                      sessionStorage.removeItem(draftKey);
                    } catch (e2) {}
                    refreshPublishBanner();
                    faqInboxRequest("GET").then(function (inbox) {
                      paint(inbox.items || []);
                    });
                    ok.textContent = "Scheduled for " + formatPublishAt(data.publishAt || pub.at) + ".";
                    ok.classList.remove("hidden");
                  });
              }
              return faqInboxRequest("POST", {
                action: "publish",
                id: item.id,
                question: question,
                answer: answer,
              }).then(function (data) {
                if (Array.isArray(data.faqs)) content.faqs = data.faqs;
                try {
                  sessionStorage.removeItem(draftKey);
                } catch (e3) {}
                paint(data.items || []);
              });
            })
            .catch(function (e) {
              if (e && e.message === "cancel") return;
              publish.disabled = !userCan("faqs");
              dismiss.disabled = false;
              err.textContent = e.message || "Could not publish.";
              err.classList.remove("hidden");
            });
        });

        dismiss.addEventListener("click", function () {
          if (!confirm("Dismiss this question without publishing?")) return;
          err.classList.add("hidden");
          ok.classList.add("hidden");
          publish.disabled = true;
          dismiss.disabled = true;
          faqInboxRequest("POST", { action: "dismiss", id: item.id })
            .then(function (data) {
              try {
                sessionStorage.removeItem(draftKey);
              } catch (e4) {}
              paint(data.items || []);
            })
            .catch(function (e) {
              publish.disabled = !userCan("faqs");
              dismiss.disabled = false;
              err.textContent = e.message || "Could not dismiss.";
              err.classList.remove("hidden");
            });
        });

        actions.appendChild(publish);
        actions.appendChild(dismiss);
        card.appendChild(actions);
        card.appendChild(err);
        card.appendChild(ok);
        list.appendChild(card);
      });
    }

    faqInboxRequest("GET")
      .then(function (data) {
        paint(data.items || []);
      })
      .catch(function () {
        status.textContent = "Could not load inbox.";
        status.className = "error faq-inbox-status";
      });
  }

  function setActivePage(id, pushHash) {
    if (!pageAllowed(id)) return;
    activePageId = getPage(id).id;
    if (pushHash !== false) {
      try {
        history.replaceState(null, "", "#" + activePageId);
      } catch (e) {}
    }
    renderNav();
    renderPanel();
    var panel = document.getElementById("admin-panel");
    if (panel) panel.scrollTop = 0;
  }

  var navGroupOpen = null;
  function loadNavGroupOpen() {
    if (navGroupOpen) return navGroupOpen;
    navGroupOpen = {};
    try {
      var raw = localStorage.getItem("vsa-admin-nav-groups");
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") navGroupOpen = parsed;
      }
    } catch (e) {}
    return navGroupOpen;
  }
  function saveNavGroupOpen() {
    try {
      localStorage.setItem("vsa-admin-nav-groups", JSON.stringify(loadNavGroupOpen()));
    } catch (e) {}
  }
  function isNavGroupExpanded(groupName, pagesInGroup) {
    var activeInGroup = pagesInGroup.some(function (p) {
      return p.id === activePageId;
    });
    if (activeInGroup) return true;
    var stored = loadNavGroupOpen();
    if (Object.prototype.hasOwnProperty.call(stored, groupName)) {
      return !!stored[groupName];
    }
    return false;
  }

  function isMobileAdminNav() {
    try {
      return window.matchMedia("(max-width: 900px)").matches;
    } catch (e) {
      return window.innerWidth <= 900;
    }
  }

  function renderNav() {
    var nav = document.getElementById("admin-nav");
    nav.innerHTML = "";
    var mobileNav = isMobileAdminNav();
    nav.classList.toggle("is-mobile-chips", false);
    nav.classList.toggle("is-mobile-menu", mobileNav);
    var pages = visiblePages();
    if (!pages.length) {
      nav.appendChild(el("p", { class: "muted", text: "No sections assigned to your account." }));
      return;
    }

    function appendPageButton(host, page) {
      var label = page.label;
      if (page.id === "faq-inbox" && faqInboxCount > 0) {
        label = page.label + " (" + faqInboxCount + ")";
      }
      if (page.id === "messages" && messagesCount > 0) {
        label = page.label + " (" + messagesCount + ")";
      }
      if (page.id === "subscribers" && unsubPendingCount > 0) {
        label = page.label + " (" + unsubPendingCount + ")";
      }
      var btn = el("button", {
        type: "button",
        class: page.id === activePageId ? "active" : "",
      });
      btn.setAttribute("data-nav", page.id);
      btn.appendChild(navIcon(page.id));
      btn.appendChild(el("span", { class: "admin-nav-label", text: label }));
      if (page.id === "mail" && mailUnreadCount > 0) {
        var mailText = formatMailBadgeCount(mailUnreadCount);
        var mailBadge = el("span", { class: "admin-nav-badge", text: mailText });
        mailBadge.setAttribute("data-digits", String(mailText.length));
        mailBadge.setAttribute("aria-label", mailUnreadCount + " unread");
        btn.appendChild(mailBadge);
      }
      btn.addEventListener("click", function () {
        setActivePage(page.id);
      });
      host.appendChild(btn);
    }

    // Mobile: current page bar + arrow opens a dropdown of every section.
    if (mobileNav) {
      var current = getPage(activePageId) || pages[0];
      var wrap = el("div", { class: "admin-mobile-nav" });
      var trigger = el("button", {
        type: "button",
        class: "admin-mobile-nav-trigger",
        "aria-expanded": "false",
        "aria-haspopup": "listbox",
        "aria-label": "Open section menu. Current: " + (current.label || "Dashboard"),
      });
      var triggerMain = el("span", { class: "admin-mobile-nav-current" });
      triggerMain.appendChild(navIcon(current.id));
      triggerMain.appendChild(
        el("span", { class: "admin-mobile-nav-current-label", text: current.label || "Dashboard" }),
      );
      trigger.appendChild(triggerMain);
      trigger.appendChild(
        el("span", {
          class: "admin-mobile-nav-chevron",
          "aria-hidden": "true",
          text: "▾",
        }),
      );

      var menu = el("div", {
        class: "admin-mobile-nav-menu",
        role: "listbox",
        hidden: "hidden",
      });
      menu.setAttribute("aria-label", "Admin sections");

      var groups = [];
      var byGroup = {};
      pages.forEach(function (page) {
        var g = page.group || "Main";
        if (!byGroup[g]) {
          byGroup[g] = [];
          groups.push(g);
        }
        byGroup[g].push(page);
      });

      groups.forEach(function (groupName) {
        var list = byGroup[groupName] || [];
        if (groupName && groupName !== "Main") {
          menu.appendChild(el("div", { class: "admin-mobile-nav-group", text: groupName }));
        }
        list.forEach(function (page) {
          var item = el("button", {
            type: "button",
            class:
              "admin-mobile-nav-item" + (page.id === activePageId ? " is-active" : ""),
            role: "option",
          });
          item.setAttribute("data-nav", page.id);
          item.setAttribute("aria-selected", page.id === activePageId ? "true" : "false");
          item.appendChild(navIcon(page.id));
          var itemLabel = page.label;
          if (page.id === "faq-inbox" && faqInboxCount > 0) {
            itemLabel = page.label + " (" + faqInboxCount + ")";
          }
          if (page.id === "messages" && messagesCount > 0) {
            itemLabel = page.label + " (" + messagesCount + ")";
          }
          if (page.id === "subscribers" && unsubPendingCount > 0) {
            itemLabel = page.label + " (" + unsubPendingCount + ")";
          }
          item.appendChild(el("span", { class: "admin-nav-label", text: itemLabel }));
          if (page.id === "mail" && mailUnreadCount > 0) {
            var mt = formatMailBadgeCount(mailUnreadCount);
            var mb = el("span", { class: "admin-nav-badge", text: mt });
            mb.setAttribute("data-digits", String(mt.length));
            item.appendChild(mb);
          }
          item.addEventListener("click", function () {
            closeMobileNavMenu();
            setActivePage(page.id);
          });
          menu.appendChild(item);
        });
      });

      function closeMobileNavMenu() {
        wrap.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        menu.setAttribute("hidden", "hidden");
        document.removeEventListener("click", onDocClick, true);
        document.removeEventListener("keydown", onKey, true);
      }
      function openMobileNavMenu() {
        wrap.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        menu.removeAttribute("hidden");
        document.addEventListener("click", onDocClick, true);
        document.addEventListener("keydown", onKey, true);
      }
      function onDocClick(e) {
        if (!wrap.contains(e.target)) closeMobileNavMenu();
      }
      function onKey(e) {
        if (e.key === "Escape") closeMobileNavMenu();
      }

      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        if (wrap.classList.contains("is-open")) closeMobileNavMenu();
        else openMobileNavMenu();
      });

      wrap.appendChild(trigger);
      wrap.appendChild(menu);
      nav.appendChild(wrap);
      refreshAttentionStrip();
      return;
    }

    var groups = [];
    var byGroup = {};
    pages.forEach(function (page) {
      var g = page.group || "";
      if (!byGroup[g]) {
        byGroup[g] = [];
        groups.push(g);
      }
      byGroup[g].push(page);
    });

    groups.forEach(function (groupName) {
      var list = byGroup[groupName] || [];
      if (!groupName) {
        list.forEach(function (page) {
          appendPageButton(nav, page);
        });
        return;
      }

      var expanded = isNavGroupExpanded(groupName, list);
      var wrap = el("div", {
        class: "admin-nav-section" + (expanded ? " is-open" : ""),
      });
      wrap.setAttribute("data-nav-group", groupName);

      var toggle = el("button", {
        type: "button",
        class: "admin-nav-group-toggle",
        "aria-expanded": expanded ? "true" : "false",
      });
      toggle.appendChild(el("span", { class: "admin-nav-group-chevron", text: "▾" }));
      toggle.appendChild(el("span", { class: "admin-nav-group-title", text: groupName }));
      toggle.appendChild(el("span", { class: "admin-nav-group-count", text: String(list.length) }));

      var items = el("div", { class: "admin-nav-group-items" });
      if (!expanded) items.setAttribute("hidden", "hidden");

      list.forEach(function (page) {
        appendPageButton(items, page);
      });

      toggle.addEventListener("click", function () {
        var next = !wrap.classList.contains("is-open");
        wrap.classList.toggle("is-open", next);
        toggle.setAttribute("aria-expanded", next ? "true" : "false");
        if (next) items.removeAttribute("hidden");
        else items.setAttribute("hidden", "hidden");
        loadNavGroupOpen()[groupName] = next;
        saveNavGroupOpen();
      });

      wrap.appendChild(toggle);
      wrap.appendChild(items);
      nav.appendChild(wrap);
    });

    refreshAttentionStrip();
  }

  (function bindMobileNavListener() {
    try {
      var mq = window.matchMedia("(max-width: 900px)");
      var handler = function () {
        renderNav();
      };
      if (mq.addEventListener) mq.addEventListener("change", handler);
      else if (mq.addListener) mq.addListener(handler);
    } catch (e) {}
  })();

  function savePage(page, saveBtn, statusEl) {
    if (page.id === "team") {
      var blankEmails = 0;
      var totalMembers = 0;
      ["executiveBoard", "techTeam", "royaleDirectors"].forEach(function (key) {
        var list = (content.team && content.team[key]) || [];
        if (!Array.isArray(list)) return;
        list.forEach(function (m) {
          if (!m || typeof m !== "object") return;
          totalMembers++;
          if (!String(m.email || "").trim()) blankEmails++;
        });
      });
      if (totalMembers > 0 && blankEmails > 0) {
        var okTeam = confirm(
          blankEmails +
            " of " +
            totalMembers +
            " team members have no email yet. Publish anyway?\n\n(You can add real emails later in Admin → Team.)",
        );
        if (!okTeam) return;
      }
    }
    var keys = pageSaveKeys(page);
    openPublishDialog()
      .then(function (pub) {
        saveBtn.disabled = true;
        statusEl.className = "save-status pending";
        statusEl.textContent = pub.mode === "schedule" ? "Scheduling…" : "Publishing…";

        var done;
        if (pub.mode === "schedule") {
          var sections = {};
          keys.forEach(function (key) {
            sections[key] = content[key];
          });
          done = fetch("publish.php", {
            method: "POST",
            headers: { "content-type": "application/json", "X-CSRF-Token": window.CSRF_TOKEN || "" },
            credentials: "same-origin",
            body: JSON.stringify({
              action: "enqueue",
              page: page.id,
              at: pub.at,
              sections: sections,
              csrf: window.CSRF_TOKEN || "",
            }),
            cache: "no-store",
          })
            .then(function (r) {
              return r.text().then(function (text) {
                var data = null;
                try {
                  data = JSON.parse(text || "{}");
                } catch (err) {
                  throw new Error("Schedule failed (invalid server response).");
                }
                if (!r.ok || !data || !data.ok) {
                  throw new Error((data && data.error) || "Schedule failed.");
                }
                if (Array.isArray(data.pending)) {
                  window.PUBLISH_PENDING = data.pending;
                }
                return data;
              });
            })
            .then(function (data) {
              saveBtn.disabled = false;
              statusEl.className = "save-status ok";
              statusEl.textContent = "Scheduled for " + formatPublishAt(data.publishAt || pub.at) + ".";
              refreshPublishBanner();
              refreshAttentionStrip();
              renderPanel();
              var status = document.querySelector(".save-status");
              if (status) {
                status.className = "save-status ok";
                status.textContent = "Scheduled for " + formatPublishAt(data.publishAt || pub.at) + ".";
              }
            });
        } else {
          var chain = Promise.resolve();
          keys.forEach(function (key) {
            chain = chain.then(function () {
              return saveSection(key, page.id, false, { mode: "asap" });
            });
          });
          done = chain.then(function (last) {
            if (last && Array.isArray(last.pending)) {
              window.PUBLISH_PENDING = last.pending;
            }
            saveBtn.disabled = false;
            statusEl.className = "save-status ok";
            statusEl.textContent = "Published.";
            if (keys.indexOf("branding") !== -1) applyAdminLogo();
            refreshPublishBanner();
            refreshAttentionStrip();
            renderPanel();
            var status = document.querySelector(".save-status");
            if (status) {
              status.className = "save-status ok";
              status.textContent = "Published.";
            }
          });
        }

        return done;
      })
      .catch(function (err) {
        if (err && err.message === "cancel") {
          return;
        }
        saveBtn.disabled = false;
        statusEl.className = "save-status err";
        statusEl.textContent = (err && err.message) || "Publish failed.";
      });
  }

  function dashboardEditor(mount) {
    var wrap = el("div", { class: "admin-block dashboard-block" });
    var who = (ADMIN_USER && ADMIN_USER.username) || "admin";
    var hour = new Date().getHours();
    var hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    wrap.appendChild(
      el("p", {
        class: "dashboard-hello",
        text: hello + ", " + who + ".",
      }),
    );

    var site = (content && content.site) || {};
    var constructionOn =
      String(site.constructionMode || "").toLowerCase() === "yes" ||
      site.constructionMode === true ||
      site.constructionMode === 1;
    var pending = Array.isArray(window.PUBLISH_PENDING) ? window.PUBLISH_PENDING.length : 0;

    function countVisible(list) {
      if (!Array.isArray(list)) return 0;
      var n = 0;
      list.forEach(function (item) {
        if (itemIsVisible(item)) n++;
      });
      return n;
    }
    function countTeam() {
      var n = 0;
      ["executiveBoard", "techTeam", "royaleDirectors"].forEach(function (key) {
        n += countVisible((content.team && content.team[key]) || []);
      });
      return n;
    }

    function makeRing(pct, color) {
      var wrapSvg = document.createElement("div");
      wrapSvg.className = "dashboard-ring";
      wrapSvg.setAttribute("aria-hidden", "true");
      var r = 30;
      var c = 2 * Math.PI * r;
      var p = Math.max(0, Math.min(1, Number(pct) || 0));
      var filled = p * c;
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 80 80");
      svg.setAttribute("class", "dashboard-ring-svg");
      var track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      track.setAttribute("class", "dashboard-ring-track");
      track.setAttribute("cx", "40");
      track.setAttribute("cy", "40");
      track.setAttribute("r", String(r));
      track.setAttribute("fill", "none");
      track.setAttribute("stroke-width", "8");
      var prog = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      prog.setAttribute("class", "dashboard-ring-progress");
      prog.setAttribute("cx", "40");
      prog.setAttribute("cy", "40");
      prog.setAttribute("r", String(r));
      prog.setAttribute("fill", "none");
      prog.setAttribute("stroke-width", "8");
      prog.setAttribute("stroke-linecap", "round");
      prog.setAttribute("stroke", color || "var(--orange)");
      prog.setAttribute("stroke-dasharray", filled.toFixed(2) + " " + c.toFixed(2));
      prog.setAttribute("transform", "rotate(-90 40 40)");
      svg.appendChild(track);
      svg.appendChild(prog);
      wrapSvg.appendChild(svg);
      return wrapSvg;
    }

    function makeSplitRing(parts) {
      // parts: [{ value, color }, ...] — builds a simple donut from shares
      var wrapSvg = document.createElement("div");
      wrapSvg.className = "dashboard-ring";
      wrapSvg.setAttribute("aria-hidden", "true");
      var r = 30;
      var c = 2 * Math.PI * r;
      var total = 0;
      (parts || []).forEach(function (part) {
        total += Math.max(0, Number(part.value) || 0);
      });
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 80 80");
      svg.setAttribute("class", "dashboard-ring-svg");
      var track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      track.setAttribute("class", "dashboard-ring-track");
      track.setAttribute("cx", "40");
      track.setAttribute("cy", "40");
      track.setAttribute("r", String(r));
      track.setAttribute("fill", "none");
      track.setAttribute("stroke-width", "8");
      svg.appendChild(track);
      if (total <= 0) {
        wrapSvg.appendChild(svg);
        return wrapSvg;
      }
      var offset = 0;
      parts.forEach(function (part) {
        var v = Math.max(0, Number(part.value) || 0);
        if (v <= 0) return;
        var len = (v / total) * c;
        var seg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        seg.setAttribute("class", "dashboard-ring-progress");
        seg.setAttribute("cx", "40");
        seg.setAttribute("cy", "40");
        seg.setAttribute("r", String(r));
        seg.setAttribute("fill", "none");
        seg.setAttribute("stroke-width", "8");
        seg.setAttribute("stroke-linecap", "butt");
        seg.setAttribute("stroke", part.color || "var(--orange)");
        seg.setAttribute("stroke-dasharray", len.toFixed(2) + " " + c.toFixed(2));
        seg.setAttribute("stroke-dashoffset", (-offset).toFixed(2));
        seg.setAttribute("transform", "rotate(-90 40 40)");
        svg.appendChild(seg);
        offset += len;
      });
      wrapSvg.appendChild(svg);
      return wrapSvg;
    }

    var statusGrid = el("div", { class: "dashboard-status-grid" });
    function statusCard(title, value, tone, pageId, titleAttr) {
      var card = el("button", {
        type: "button",
        class: "dashboard-status-card" + (tone ? " is-" + tone : ""),
      });
      if (titleAttr) card.title = titleAttr;
      card.appendChild(el("span", { class: "dashboard-status-label", text: title }));
      card.appendChild(el("strong", { class: "dashboard-status-value", text: value }));
      if (pageId && pageAllowed(pageId)) {
        card.addEventListener("click", function () {
          setActivePage(pageId);
        });
      } else {
        card.disabled = true;
        card.classList.add("is-static");
      }
      statusGrid.appendChild(card);
    }
    statusCard(
      "Site mode",
      constructionOn ? "Construction on" : "Live",
      constructionOn ? "warn" : "ok",
      pageAllowed("site") ? "site" : "",
    );
    statusCard(
      "Needs attention",
      String(
        (faqInboxCount || 0) +
          (messagesCount || 0) +
          (unsubPendingCount || 0) +
          (mailUnreadCount || 0) +
          pending,
      ),
      (faqInboxCount || messagesCount || unsubPendingCount || mailUnreadCount || pending) > 0
        ? "warn"
        : "ok",
      "",
    );
    statusCard("Scheduled publishes", String(pending), pending ? "warn" : "", pageAllowed("publish") ? "publish" : "");
    statusCard(
      "Holiday theme",
      String(site.holidayTheme || "auto"),
      "",
      pageAllowed("site") ? "site" : "",
    );
    var timeline = window.SITE_TIMELINE || {};
    statusCard(
      "Last published",
      formatRelativeWhen(timeline.lastPublished),
      "",
      pageAllowed("activity") ? "activity" : pageAllowed("publish") ? "publish" : "",
      timeline.lastPublished ? formatInboxDate(timeline.lastPublished) : "No publish recorded yet",
    );
    statusCard(
      "Last edited",
      formatRelativeWhen(timeline.lastEdited),
      "",
      pageAllowed("activity") ? "activity" : pageAllowed("publish") ? "publish" : "",
      timeline.lastEdited ? formatInboxDate(timeline.lastEdited) : "No edits recorded yet",
    );
    wrap.appendChild(statusGrid);

    var attention = el("div", { class: "dashboard-section" });
    attention.appendChild(el("h3", { class: "dashboard-section-title", text: "Needs attention" }));
    var attentionList = el("div", { class: "dashboard-attention-list" });
    function attentionRow(pageId, label, count) {
      if (!count || count <= 0 || !pageAllowed(pageId)) return;
      var row = el("button", { type: "button", class: "dashboard-attention-row" });
      row.appendChild(el("span", { text: label }));
      row.appendChild(el("strong", { text: String(count) }));
      row.addEventListener("click", function () {
        setActivePage(pageId);
      });
      attentionList.appendChild(row);
    }
    attentionRow("faq-inbox", "FAQ questions waiting", faqInboxCount);
    attentionRow("messages", "Messages", messagesCount);
    attentionRow("subscribers", "Unsubscribe requests", unsubPendingCount);
    attentionRow("mail", "Unread mail", mailUnreadCount);
    attentionRow("publish", "Scheduled publishes", pending);
    if (!attentionList.childNodes.length) {
      attentionList.appendChild(
        el("p", { class: "muted", text: "Nothing waiting — inbox and queue look clear." }),
      );
    }
    attention.appendChild(attentionList);
    wrap.appendChild(attention);

    wrap.appendChild(dashboardUptimeSection());

    if (ADMIN_USER.isRoot) {
      wrap.appendChild(dashboardHealthSection());
    }

    var eventsN = countVisible((content.events && content.events.upcoming) || []);
    var teamN = countTeam();
    var faqsN = countVisible(content.faqs || []);
    var merchN = countVisible((content.merch && content.merch.products) || []);
    var softMax = Math.max(8, eventsN, teamN, faqsN, merchN);

    var stats = el("div", { class: "dashboard-section" });
    stats.appendChild(el("h3", { class: "dashboard-section-title", text: "At a glance" }));
    stats.appendChild(
      el("p", {
        class: "muted dashboard-section-note",
        text: "Rings scale against your current content set. Uploads show in-use vs unused.",
      }),
    );
    var statsGrid = el("div", { class: "dashboard-stats-grid" });
    function glanceCard(opts) {
      var b = el("button", {
        type: "button",
        class: "dashboard-stat dashboard-stat--ring" + (opts.loading ? " is-loading" : ""),
      });
      var visual = el("div", { class: "dashboard-stat-visual" });
      if (opts.ring) visual.appendChild(opts.ring);
      var center = el("div", { class: "dashboard-stat-center" });
      center.appendChild(el("strong", { text: opts.valueText != null ? String(opts.valueText) : "…" }));
      visual.appendChild(center);
      b.appendChild(visual);
      b.appendChild(el("span", { class: "dashboard-stat-label", text: opts.label || "" }));
      if (opts.detail) b.appendChild(el("span", { class: "dashboard-stat-detail", text: opts.detail }));
      if (opts.pageId && pageAllowed(opts.pageId) && !opts.loading) {
        b.addEventListener("click", function () {
          setActivePage(opts.pageId);
        });
      } else {
        b.disabled = true;
        b.classList.add("is-static");
      }
      statsGrid.appendChild(b);
      return b;
    }

    glanceCard({
      label: "Upcoming events",
      valueText: eventsN,
      pageId: "events",
      ring: makeRing(eventsN / softMax, "#FF811D"),
    });
    glanceCard({
      label: "Team on site",
      valueText: teamN,
      pageId: "team",
      ring: makeRing(teamN / softMax, "#344E74"),
    });
    glanceCard({
      label: "Published FAQs",
      valueText: faqsN,
      pageId: "faqs",
      ring: makeRing(faqsN / softMax, "#5B7C99"),
    });
    glanceCard({
      label: "Merch products",
      valueText: merchN,
      pageId: "merch",
      ring: makeRing(merchN / softMax, "#C46B2E"),
    });
    wrap.appendChild(stats);
    wrap.appendChild(statsGrid);

    var mediaCard = glanceCard({
      label: "Uploads",
      valueText: "…",
      detail: "Loading…",
      pageId: "media",
      loading: true,
      ring: makeRing(0, "#344E74"),
    });
    if (pageAllowed("media")) {
      fetch("media.php?action=stats", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": window.CSRF_TOKEN || "" },
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          if (!data || !data.ok) throw new Error("stats");
          var used = Number(data.used) || 0;
          var unused = Number(data.unused) || 0;
          var total = Number(data.count) || used + unused;
          var visual = mediaCard.querySelector(".dashboard-stat-visual");
          var center = mediaCard.querySelector(".dashboard-stat-center");
          if (visual) {
            visual.innerHTML = "";
            visual.appendChild(
              makeSplitRing([
                { value: used, color: "#344E74" },
                { value: unused, color: "#FF811D" },
              ]),
            );
            if (center) visual.appendChild(center);
          }
          if (center && center.querySelector("strong")) {
            center.querySelector("strong").textContent = String(total);
          }
          var detail = mediaCard.querySelector(".dashboard-stat-detail");
          if (detail) {
            detail.textContent =
              used + " in use · " + unused + " unused";
          }
          mediaCard.classList.remove("is-loading", "is-static");
          mediaCard.disabled = false;
          mediaCard.onclick = function () {
            setActivePage("media");
          };
        })
        .catch(function () {
          mediaCard.classList.remove("is-loading");
          var strong = mediaCard.querySelector(".dashboard-stat-center strong");
          if (strong) strong.textContent = "—";
          var detail = mediaCard.querySelector(".dashboard-stat-detail");
          if (detail) detail.textContent = "Unavailable";
        });
    } else {
      mediaCard.classList.remove("is-loading");
      var strongOff = mediaCard.querySelector(".dashboard-stat-center strong");
      if (strongOff) strongOff.textContent = "—";
      var detailOff = mediaCard.querySelector(".dashboard-stat-detail");
      if (detailOff) detailOff.textContent = "";
    }

    if (pageAllowed("subscribers")) {
      var subCard = glanceCard({
        label: "Subscribers",
        valueText: "…",
        detail: "Loading…",
        pageId: "subscribers",
        loading: true,
        ring: makeRing(0, "#FF811D"),
      });
      subscribersRequest("GET")
        .then(function (data) {
          var n = Number(data.count || (data.items || []).length || 0);
          var visual = subCard.querySelector(".dashboard-stat-visual");
          var center = subCard.querySelector(".dashboard-stat-center");
          var subMax = Math.max(softMax, n, 8);
          if (visual) {
            visual.innerHTML = "";
            visual.appendChild(makeRing(n / subMax, "#FF811D"));
            if (center) visual.appendChild(center);
          }
          if (center && center.querySelector("strong")) {
            center.querySelector("strong").textContent = String(n);
          }
          var detail = subCard.querySelector(".dashboard-stat-detail");
          if (detail) detail.textContent = "Newsletter list";
          subCard.classList.remove("is-loading", "is-static");
          subCard.disabled = false;
          subCard.onclick = function () {
            setActivePage("subscribers");
          };
        })
        .catch(function () {
          subCard.classList.remove("is-loading");
          var strong = subCard.querySelector(".dashboard-stat-center strong");
          if (strong) strong.textContent = "—";
        });
    }

    var shortcuts = el("div", { class: "dashboard-section" });
    shortcuts.appendChild(el("h3", { class: "dashboard-section-title", text: "Quick tasks" }));
    var shortList = el("div", { class: "dashboard-shortcuts" });
    var quick = [
      { id: "home", label: "Edit Home" },
      { id: "events", label: "Edit Events" },
      { id: "media", label: "Media library" },
      { id: "subscribers", label: "Newsletter" },
      { id: "faq-inbox", label: "FAQ Inbox" },
      { id: "mail", label: "Mail" },
      { id: "site", label: "Site settings" },
      { id: "backup", label: "Backup" },
    ];
    quick.forEach(function (q) {
      if (!pageAllowed(q.id)) return;
      var b = el("button", { type: "button", class: "btn-outline dashboard-shortcut" });
      b.appendChild(navIcon(q.id));
      b.appendChild(document.createTextNode(q.label));
      b.addEventListener("click", function () {
        setActivePage(q.id);
      });
      shortList.appendChild(b);
    });
    var viewSite = el("a", {
      class: "btn btn-orange sm dashboard-shortcut",
      href: "../",
      target: "_blank",
      rel: "noopener noreferrer",
      text: "View site ↗",
    });
    shortList.appendChild(viewSite);
    shortcuts.appendChild(shortList);
    wrap.appendChild(shortcuts);

    if (ADMIN_USER && ADMIN_USER.isRoot) {
      var recent = el("div", { class: "dashboard-section" });
      recent.appendChild(el("h3", { class: "dashboard-section-title", text: "Recent activity" }));
      var recentStatus = el("p", { class: "muted", text: "Loading…" });
      var recentList = el("ul", { class: "dashboard-activity" });
      recent.appendChild(recentStatus);
      recent.appendChild(recentList);
      wrap.appendChild(recent);
      activityRequest("GET", null, "?limit=8")
        .then(function (data) {
          recentStatus.textContent = "";
          var rows = Array.isArray(data.items) ? data.items.slice(0, 8) : [];
          if (!rows.length) {
            recentStatus.textContent = "No activity yet.";
            return;
          }
          rows.forEach(function (row) {
            var li = el("li");
            li.appendChild(
              el("span", {
                class: "dashboard-activity-when",
                text: formatInboxDate(row.at || row.createdAt || ""),
              }),
            );
            li.appendChild(
              el("span", {
                text:
                  (row.actor || row.username || "system") +
                  " · " +
                  (row.action || "") +
                  (row.detail ? " — " + row.detail : ""),
              }),
            );
            recentList.appendChild(li);
          });
          var more = el("button", { type: "button", class: "btn-ghost", text: "Open activity log" });
          more.addEventListener("click", function () {
            setActivePage("activity");
          });
          recent.appendChild(more);
        })
        .catch(function () {
          recentStatus.textContent = "Could not load activity.";
        });
    }

    mount.appendChild(wrap);
  }
  function renderPanel() {
    var panel = document.getElementById("admin-panel");
    panel.innerHTML = "";
    var pages = visiblePages();
    if (!pages.length) {
      panel.appendChild(
        el("p", {
          class: "muted",
          text: "Your account has no section permissions. Ask the root admin to grant access.",
        }),
      );
      return;
    }
    var canOpenActive = pages.some(function (p) {
      return p.id === activePageId;
    });
    if (!canOpenActive) {
      activePageId = pages[0].id;
    }
    var page = getPage(activePageId);

    var head = el("div", { class: "admin-page-head" });
    var titles = el("div");
    titles.appendChild(el("h1", { text: page.label }));
    if (page.description) {
      titles.appendChild(el("p", { class: "section-desc", text: page.description }));
    }
    head.appendChild(titles);
    if (page.preview || page.id === "team") {
      var view = el("a", {
        class: "admin-view-page",
        href: pagePreviewHref(page) || page.preview,
        target: "_blank",
        rel: "noopener noreferrer",
        text: "View page ↗",
      });
      head.appendChild(view);
    }
    panel.appendChild(head);

    var body = el("div", { class: "admin-page-body" });

    if (page.dashboard) {
      dashboardEditor(body);
      panel.appendChild(body);
      return;
    }

    if (page.faqInbox) {
      faqInboxEditor(body);
      panel.appendChild(body);
      return;
    }

    if (page.messages) {
      messagesEditor(body);
      panel.appendChild(body);
      return;
    }

    if (page.blockedIps) {
      blockedIpsEditor(body);
      panel.appendChild(body);
      return;
    }

    if (page.subscribers) {
      unsubRequestsEditor(body);
      newsletterComposeEditor(body);
      subscribersEditor(body);
      panel.appendChild(body);
      return;
    }

    if (page.mail) {
      mailEditor(body);
      panel.appendChild(body);
      return;
    }

    if (page.publishQueue) {
      publishQueueEditor(body);
      panel.appendChild(body);
      return;
    }

    if (page.mediaLibrary) {
      mediaLibraryEditor(body);
      panel.appendChild(body);
      return;
    }

    if (page.backup) {
      backupEditor(body);
      panel.appendChild(body);
      return;
    }

    if (page.users) {
      usersEditor(body);
      panel.appendChild(body);
      return;
    }

    if (page.activity) {
      activityLogEditor(body);
      panel.appendChild(body);
      return;
    }

    (page.sections || []).forEach(function (sectionKey) {
      var section = SECTION_DEFS[sectionKey];
      if (!section) return;
      var block = el("div", { class: "admin-block" });
      if ((page.sections || []).length > 1 || page.linkFields) {
        block.appendChild(el("h2", { class: "admin-block-title", text: section.label }));
        if (section.description) {
          block.appendChild(el("p", { class: "section-desc", text: section.description }));
        }
      } else if (section.description) {
        block.appendChild(el("p", { class: "section-desc", text: section.description }));
      }
      renderSectionBody(section, block);
      body.appendChild(block);
    });

    if (page.linkFields && page.linkFields.length) {
      if (!content.links) content.links = {};
      var linkBlock = el("div", { class: "admin-block" });
      linkBlock.appendChild(el("h2", { class: "admin-block-title", text: "Buttons & links" }));
      page.linkFields.forEach(function (f) {
        linkBlock.appendChild(fieldEditor(content.links, f));
      });
      body.appendChild(linkBlock);
    }

    panel.appendChild(body);

    var bar = el("div", { class: "save-bar" });
    var save = el("button", { type: "button", class: "btn btn-orange", text: "Save " + page.label });
    var status = el("span", { class: "save-status" });
    save.addEventListener("click", function () {
      savePage(page, save, status);
    });
    bar.appendChild(save);
    bar.appendChild(status);
    panel.appendChild(bar);
  }

  function initTheme() {
    var THEME_KEY = "vsa-theme";
    var ORDER = ["light", "dark", "system"];
    function pref() {
      try {
        var p = localStorage.getItem(THEME_KEY);
        return p === "light" || p === "dark" || p === "system" ? p : "light";
      } catch (e) {
        return "light";
      }
    }
    function resolved(p) {
      if (p === "dark") return "dark";
      if (p === "system") {
        try {
          return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        } catch (e2) {
          return "light";
        }
      }
      return "light";
    }
    function apply(p, persist) {
      p = p || pref();
      if (p !== "light" && p !== "dark" && p !== "system") p = "light";
      var r = resolved(p);
      document.documentElement.setAttribute("data-theme", r);
      document.documentElement.setAttribute("data-theme-pref", p);
      if (persist) {
        try {
          localStorage.setItem(THEME_KEY, p);
        } catch (e3) {}
      }
      var btn = document.getElementById("theme-toggle");
      if (!btn) return;
      btn.setAttribute("data-pref", p);
      btn.setAttribute("aria-pressed", r === "dark" ? "true" : "false");
      var labels = {
        light: "Color theme: Light. Click for Dark.",
        dark: "Color theme: Dark. Click for System.",
        system: "Color theme: System. Click for Light.",
      };
      btn.setAttribute("aria-label", labels[p] || labels.light);
      btn.title = "Theme: " + p.charAt(0).toUpperCase() + p.slice(1);
    }
    apply(pref(), false);
    var btn = document.getElementById("theme-toggle");
    if (btn && !btn.getAttribute("data-theme-bound")) {
      btn.setAttribute("data-theme-bound", "1");
      btn.addEventListener("click", function () {
        var i = ORDER.indexOf(pref());
        apply(ORDER[(i + 1) % ORDER.length], true);
      });
    }
    try {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onScheme = function () {
        if (pref() === "system") apply("system", false);
      };
      if (mq.addEventListener) mq.addEventListener("change", onScheme);
      else if (mq.addListener) mq.addListener(onScheme);
    } catch (e4) {}
  }

  /** Fold legacy home.whyJoinImages[] into whyJoin[i].image so each column owns its photo. */
  function migrateWhyJoinImagesIntoColumns() {
    var home = content.home;
    if (!home || typeof home !== "object") return;
    if (!Array.isArray(home.whyJoin)) home.whyJoin = [];
    var legacy = Array.isArray(home.whyJoinImages) ? home.whyJoinImages : [];
    if (!legacy.length) return;
    var moved = false;
    for (var i = 0; i < Math.max(home.whyJoin.length, legacy.length); i++) {
      if (!home.whyJoin[i] || typeof home.whyJoin[i] !== "object") {
        home.whyJoin[i] = { title: "", body: "", image: "" };
      }
      var col = home.whyJoin[i];
      if (!String(col.image || "").trim() && legacy[i]) {
        col.image = legacy[i];
        moved = true;
      }
    }
    if (moved) {
      // Keep legacy array empty so the old separate list cannot drift out of sync.
      home.whyJoinImages = [];
    }
  }

  function init() {
    initTheme();
    try {
      content = JSON.parse(document.getElementById("content-data").textContent);
    } catch (e) {
      document.getElementById("admin-panel").innerHTML =
        "<p class='error'>Failed to load content.</p>";
      return;
    }
    if (!content.links) content.links = {};
    migrateWhyJoinImagesIntoColumns();
    var pages = visiblePages();
    var hash = (location.hash || "").replace(/^#/, "");
    if (hash && getPage(hash).id === hash && pageAllowed(hash)) activePageId = hash;
    else activePageId = pages.length ? pages[0].id : "dashboard";
    renderNav();
    renderPanel();
    refreshPublishBanner();
    applyAdminLogo();
    if (userCan("faq-inbox")) {
      faqInboxRequest("GET")
        .then(function (data) {
          faqInboxCount = Array.isArray(data.items) ? data.items.length : 0;
          renderNav();
        })
        .catch(function () {});
    }
    if (userCan("messages")) {
      messagesRequest("GET")
        .then(function (data) {
          messagesCount = Array.isArray(data.items) ? data.items.length : 0;
          renderNav();
        })
        .catch(function () {});
    }
    if (userCan("subscribers")) {
      subscribersRequest("GET")
        .then(function (data) {
          unsubPendingCount = Array.isArray(data.unsubRequests) ? data.unsubRequests.length : 0;
          renderNav();
        })
        .catch(function () {});
    }
    if (userCan("mail")) {
      refreshMailNavBadge();
      setInterval(function () {
        if (document.visibilityState === "hidden") return;
        refreshMailNavBadge();
      }, 45000);
    }
    window.addEventListener("hashchange", function () {
      var id = (location.hash || "").replace(/^#/, "");
      if (id && getPage(id).id === id && id !== activePageId && pageAllowed(id)) setActivePage(id, false);
    });
  }

  init();
})();

export function initSidebarEvents() {
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menu-toggle");
    const closeToggle = document.getElementById("close-toggle");
    const overlay = document.getElementById("overlay");

    if (!sidebar || !menuToggle || !closeToggle || !overlay) {
        console.warn("Sidebar elements not found");
        return;
    }

    const openSidebar = () => {
        sidebar.classList.remove("-translate-x-full");
        menuToggle.classList.add("hidden");
        overlay.classList.remove("hidden");
        setTimeout(() => {
            overlay.classList.add("opacity-50");
            closeToggle.classList.remove("hidden");
        }, 250);
    };

    const closeSidebar = () => {
        sidebar.classList.add("-translate-x-full");
        closeToggle.classList.add("hidden");
        overlay.classList.remove("opacity-50");
        setTimeout(() => {
            overlay.classList.add("hidden");
            menuToggle.classList.remove("hidden");
        }, 250);
    };

    menuToggle.addEventListener("click", openSidebar);
    closeToggle.addEventListener("click", closeSidebar);
    overlay.addEventListener("click", closeSidebar);
}

document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // FOOTER
    // ==========================================

    fetch("components/footer.html")
        .then(function (response) {

            if (!response.ok) {
                throw new Error("Footer could not be loaded");
            }

            return response.text();
        })
        .then(function (html) {

            const footer = document.getElementById("footer");

            if (footer) {
                footer.innerHTML = html;
            }

            const year = document.getElementById("currentYear");

            if (year) {
                year.textContent = new Date().getFullYear();
            }

        })
        .catch(function (error) {
            console.error("Footer error:", error);
        });


    // ==========================================
    // HEADER
    // ==========================================

    fetch("components/header.html")
        .then(function (response) {

            if (!response.ok) {
                throw new Error("Header could not be loaded");
            }

            return response.text();
        })
        .then(function (html) {

            const header = document.getElementById("header");

            if (!header) {
                return;
            }

            // Insert header first
            header.innerHTML = html;

            // IMPORTANT:
            // Find menu elements AFTER header has loaded
            const menuBtn =
                document.getElementById("mobileMenuBtn");

            const mobileNav =
                document.getElementById("mobileNavigation");


            if (!menuBtn || !mobileNav) {
                console.error("Mobile menu elements not found");
                return;
            }


            // ==========================================
            // HAMBURGER CLICK
            // ==========================================

            menuBtn.addEventListener("click", function () {

                menuBtn.classList.toggle("is-active");
                mobileNav.classList.toggle("is-active");

                const isOpen =
                    mobileNav.classList.contains("is-active");

                menuBtn.setAttribute(
                    "aria-expanded",
                    isOpen ? "true" : "false"
                );

                document.body.classList.toggle(
                    "menu-open",
                    isOpen
                );

            });


            // ==========================================
            // CLOSE AFTER CLICKING LINK
            // ==========================================

            const mobileLinks =
                mobileNav.querySelectorAll("a");

            mobileLinks.forEach(function (link) {

                link.addEventListener("click", function () {

                    mobileNav.classList.remove("is-active");
                    menuBtn.classList.remove("is-active");

                    menuBtn.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                    document.body.classList.remove("menu-open");

                });

            });

        })
        .catch(function (error) {
            console.error("Header error:", error);
        });

});
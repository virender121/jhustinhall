document.addEventListener("DOMContentLoaded", function () {

    // Load footer
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

            // Automatically update copyright year
            const year = document.getElementById("currentYear");

            if (year) {
                year.textContent = new Date().getFullYear();
            }

        })
        .catch(function (error) {
            console.error("Footer error:", error);
        });

        // =========================
       // HEADER
        // =========================

    fetch("components/header.html")
        .then(response => response.text())
        .then(html => {

            const header = document.getElementById("header");

            if (header) {
                header.innerHTML = html;
            }

        })
        .catch(error => {
            console.error("Header error:", error);
        });

});
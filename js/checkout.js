document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ELEMENTS
    ====================================================== */

    const checkoutForm =
        document.getElementById("checkoutForm");

    const checkoutProducts =
        document.getElementById("checkoutProducts");

    const subtotalElement =
        document.getElementById("checkoutSubtotal");

    const totalElement =
        document.getElementById("checkoutTotal");

    const checkoutEmpty =
        document.getElementById("checkoutEmpty");

    const shipDifferent =
        document.getElementById("shipDifferent");

    const shippingFields =
        document.getElementById("shippingFields");

    const message =
        document.getElementById("checkoutMessage");


    /* =====================================================
       LOAD CART
    ====================================================== */

    const cart = JSON.parse(
        localStorage.getItem("jhustinCart")
    ) || [];


    /* =====================================================
       MONEY
    ====================================================== */

    function money(amount) {

        return "$" + Number(amount).toFixed(2);

    }


    /* =====================================================
       HTML ESCAPE
    ====================================================== */

    function escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    /* =====================================================
       RENDER ORDER
    ====================================================== */

    function renderOrder() {

        checkoutProducts.innerHTML = "";


        /* EMPTY CART */

        if (cart.length === 0) {

            checkoutForm.style.display = "none";

            checkoutEmpty.style.display = "block";

            return;

        }


        checkoutForm.style.display = "block";

        checkoutEmpty.style.display = "none";


        let subtotal = 0;


        cart.forEach(function (product) {

            const quantity =
                Number(product.quantity) || 1;

            const price =
                Number(product.price) || 0;

            const productSubtotal =
                price * quantity;


            subtotal += productSubtotal;


            const row =
                document.createElement("tr");


            row.className = "cart_item";


            row.innerHTML = `

                <td class="product-name">

                    ${escapeHtml(product.name)}

                    <strong class="product-quantity">
                        × ${quantity}
                    </strong>

                </td>

                <td class="product-total">

                    ${money(productSubtotal)}

                </td>

            `;


            checkoutProducts.appendChild(row);

        });


        subtotalElement.textContent =
            money(subtotal);


        /*
         * Currently shipping = 0.
         *
         * Later the backend should calculate
         * shipping if physical products need it.
         */

        const shipping = 0;


        const total =
            subtotal + shipping;


        totalElement.textContent =
            money(total);

    }


    /* =====================================================
       DIFFERENT SHIPPING ADDRESS
    ====================================================== */

    shipDifferent.addEventListener(
        "change",
        function () {

            if (this.checked) {

                shippingFields.style.display =
                    "block";

            } else {

                shippingFields.style.display =
                    "none";

            }

        }
    );


    /* =====================================================
       FORM SUBMIT
    ====================================================== */

    checkoutForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            /* Browser validation */

            if (!checkoutForm.checkValidity()) {

                checkoutForm.reportValidity();

                return;

            }


            if (cart.length === 0) {

                return;

            }


            /*
             * Collect customer details.
             *
             * We will send this to Node.js later.
             */

            const formData =
                new FormData(checkoutForm);


            const customer = {};


            formData.forEach(function (value, key) {

                customer[key] = value;

            });


            console.log(
                "Customer:",
                customer
            );


            console.log(
                "Cart:",
                cart
            );


            /*
             * IMPORTANT
             *
             * Do NOT mark the order paid here.
             *
             * Next step:
             *
             * POST product IDs + quantities +
             * customer information to backend.
             *
             * Backend gets real product prices
             * and creates PayPal order.
             */


            message.textContent =
                "Checkout details are valid. Payment integration is the next step.";


            message.className =
                "checkout-message success";

        }
    );


    /* =====================================================
       INITIALIZE
    ====================================================== */

    renderOrder();

});
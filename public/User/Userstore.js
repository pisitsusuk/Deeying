// ตั้งค่า noUiSlider
document.addEventListener("DOMContentLoaded", function () {
    var slider = document.getElementById("slider");
    var minPrice = document.getElementById("min-price");
    var maxPrice = document.getElementById("max-price");

    noUiSlider.create(slider, {
        start: [0, 200000],
        connect: true,
        range: {
            "min": 0,
            "max": 200000
        },
        step: 500,
        format: {
            to: function (value) {
                return Math.round(value).toLocaleString();
            },
            from: function (value) {
                return Number(value.replace(/,/g, ""));
            }
        }
    });

    slider.noUiSlider.on("update", function (values) {
        minPrice.innerText = values[0];
        maxPrice.innerText = values[1];
    });
});
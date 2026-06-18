const theoryTabs = document.querySelectorAll(".theory-tab");
const theorySections = document.querySelectorAll(".theory-operation-section");

theoryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const targetId = tab.dataset.target;

        theoryTabs.forEach(button => {
            button.classList.remove("active");
        });

        theorySections.forEach(section => {
            section.classList.remove("active-theory-section");
        });

        tab.classList.add("active");
        document.getElementById(targetId).classList.add("active-theory-section");
    });
});
// Toggle hamburger menu - Global function for inline onclick handler
function toggleNavbar() {
  const myLinks = document.getElementById("myLinks");
  if (myLinks) {
    myLinks.classList.toggle("show");
  }
}

// Close menu when clicking on a link
document.addEventListener("DOMContentLoaded", function() {
  const myLinks = document.getElementById("myLinks");
  if (myLinks) {
    const links = myLinks.querySelectorAll("a");
    links.forEach(link => {
      link.addEventListener("click", function() {
        myLinks.classList.remove("show");
      });
    });
  }
});

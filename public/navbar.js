// Toggle hamburger menu - Global function for inline onclick handler
function toggleNavbar() {
  const myLinks = document.getElementById("myLinks");
  if (myLinks) {
    if (myLinks.style.display === "block") {
      myLinks.style.display = "none";
    } else {
      myLinks.style.display = "block";
    }
  }
}

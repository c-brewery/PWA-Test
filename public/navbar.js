// Toggle hamburger menu - Global function for inline onclick handler
function toggleNavbar() {
  const myLinks = document.getElementById("myLinks");
  if (myLinks) {
    myLinks.classList.toggle("show");
  }
}

// Handle both click and touchend events for better mobile support
function initializeNavbar() {
  const toggleButton = document.getElementById("toggleNavbarButton");
  const myLinks = document.getElementById("myLinks");
  
  if (toggleButton) {
    // Remove inline onclick and add proper event listeners
    toggleButton.removeAttribute("onclick");
    
    // Handle both click and touch events
    toggleButton.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleNavbar();
    });
    
    // Add touchend as fallback for Android
    toggleButton.addEventListener("touchend", function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleNavbar();
    });
  }
  
  // Close menu when clicking on a link
  if (myLinks) {
    const links = myLinks.querySelectorAll("a");
    links.forEach(link => {
      link.addEventListener("click", function(e) {
        e.stopPropagation();
        myLinks.classList.remove("show");
      });
      
      // Add touchend as fallback
      link.addEventListener("touchend", function(e) {
        e.stopPropagation();
        myLinks.classList.remove("show");
      });
    });
  }
  
  // Close menu when clicking outside
  document.addEventListener("click", function(e) {
    if (myLinks && e.target !== toggleButton && !myLinks.contains(e.target)) {
      myLinks.classList.remove("show");
    }
  });
  
  document.addEventListener("touchend", function(e) {
    if (myLinks && e.target !== toggleButton && !myLinks.contains(e.target)) {
      myLinks.classList.remove("show");
    }
  });
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeNavbar);

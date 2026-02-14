// Toggle hamburger menu
function toggleNavbar() {
  const myLinks = document.getElementById("myLinks");
  console.log("toggleNavbar called, current state:", myLinks?.classList.contains("show"));
  
  if (myLinks) {
    myLinks.classList.toggle("show");
    console.log("After toggle, show class present:", myLinks.classList.contains("show"));
  }
}

// Initialize navbar functionality
function initializeNavbar() {
  console.log("=== NAVBAR INITIALIZATION START ===");
  
  const toggleButton = document.getElementById("toggleNavbarButton");
  const myLinks = document.getElementById("myLinks");

  console.log("DOM Elements found:", {
    toggleButton: !!toggleButton,
    myLinks: !!myLinks,
    toggleButtonElement: toggleButton,
    myLinksElement: myLinks
  });

  if (!myLinks) {
    console.warn("⚠️ myLinks with id 'myLinks' not found! Navbar initialization will skip link handling.");
    return;
  }

  if (!toggleButton) {
    console.warn("⚠️ toggleButton with id 'toggleNavbarButton' not found; skipping hamburger listeners.");
  } else {
    // Add click listener to hamburger button
    toggleButton.addEventListener("click", function(e) {
      console.log("✅ HAMBURGER CLICK - Preventing default and calling toggleNavbar");
      e.preventDefault();
      toggleNavbar();
    });

    // Add touch listener for Android
    toggleButton.addEventListener("touchend", function(e) {
      console.log("✅ HAMBURGER TOUCH - Preventing default and calling toggleNavbar");
      e.preventDefault();
      toggleNavbar();
    });

    console.log("✅ Hamburger button listeners attached");
  }
  
  // Close menu when clicking on a menu link
  const navLinks = myLinks.querySelectorAll("a");
  console.log("Found " + navLinks.length + " links in navbar menu");
  
  navLinks.forEach((link, index) => {
    link.addEventListener("click", function(e) {
      console.log("✅ Nav link clicked (" + index + "), closing menu");
      myLinks.classList.remove("show");
    });
    
    link.addEventListener("touchend", function(e) {
      console.log("✅ Nav link touched (" + index + "), closing menu");
      myLinks.classList.remove("show");
    });
  });
  
  // Close menu when clicking outside
  document.addEventListener("click", function(e) {
    if (myLinks.classList.contains("show")) {
      // Check if click is outside the navbar
      if (!myLinks.contains(e.target) && e.target !== toggleButton) {
        console.log("✅ Click outside menu, closing");
        myLinks.classList.remove("show");
      }
    }
  });
  
  console.log("=== NAVBAR INITIALIZATION COMPLETE ===");
}

// Initialize when DOM is ready
console.log("navbar.js loaded, document.readyState:", document.readyState);

if (document.readyState === "loading") {
  console.log("DOM still loading, registering DOMContentLoaded listener");
  document.addEventListener("DOMContentLoaded", function() {
    console.log("DOMContentLoaded fired");
    initializeNavbar();
  });
} else {
  console.log("DOM already loaded, calling initializeNavbar immediately");
  initializeNavbar();
}

// Fallback initialization after a short delay
console.log("Setting 100ms timeout as fallback initialization");
setTimeout(function() {
  console.log("Timeout fired, checking if navbar needs initialization");
  const toggleButton = document.getElementById("toggleNavbarButton");
  if (toggleButton && !toggleButton._navbarInitialized) {
    console.log("Running fallback initialization");
    initializeNavbar();
  }
}, 100);

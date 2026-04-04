/* =====================================================
   main.js — Holistic Evaluator AI Theme
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ─── Video Modal ─────────────────────────────────── */
  const videoModal  = document.getElementById('videoModal');
  const quickVideo  = document.getElementById('quickVideo');

  // Open modal from any element with data-video attribute
  document.querySelectorAll('[data-video]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const src = btn.getAttribute('data-video');
      if (quickVideo) quickVideo.src = src;
      if (videoModal) {
        videoModal.classList.remove('modal-hidden');
        videoModal.classList.add('modal-visible');
      }
    });
  });

  // Close modal
  function closeVideoModal() {
    if (videoModal) {
      videoModal.classList.remove('modal-visible');
      videoModal.classList.add('modal-hidden');
    }
    if (quickVideo) quickVideo.src = ''; // stop video
  }

  document.querySelectorAll('[data-close-video]').forEach(function (btn) {
    btn.addEventListener('click', closeVideoModal);
  });

  // Close on backdrop click
  if (videoModal) {
    videoModal.addEventListener('click', function (e) {
      if (e.target === videoModal || e.target.classList.contains('modal-backdrop')) {
        closeVideoModal();
      }
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeVideoModal();
  });

  /* ─── Mobile Menu Toggle ──────────────────────────── */
  const mobileMenuBtn  = document.getElementById('mobile-menu-btn');
  const mobileMenu     = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.contains('mobile-menu-visible');
      if (isOpen) {
        mobileMenu.classList.remove('mobile-menu-visible');
        mobileMenu.classList.add('mobile-menu-hidden');
      } else {
        mobileMenu.classList.remove('mobile-menu-hidden');
        mobileMenu.classList.add('mobile-menu-visible');
      }
    });

    // Close mobile menu when a nav link is clicked
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('mobile-menu-visible');
        mobileMenu.classList.add('mobile-menu-hidden');
      });
    });
  }

  /* ─── Sticky Header Shadow on Scroll ─────────────── */
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        header.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)';
      } else {
        header.style.boxShadow = 'none';
      }
    });
  }

  /* ─── Scroll Reveal Animation ─────────────────────── */
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(
    '.stat-card, .why-card, .step-card, .testimonial-card, .benefit-icon'
  ).forEach(function (el) {
    observer.observe(el);
  });

  /* ─── Demo Form Submission ────────────────────────── */
  const demoForm = document.getElementById('demo-form');
  if (demoForm) {
    demoForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const schoolName   = document.getElementById('school-name').value.trim();
      const contactName  = document.getElementById('contact-name').value.trim();
      const contactEmail = document.getElementById('contact-email').value.trim();

      if (!schoolName || !contactName || !contactEmail) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      if (!isValidEmail(contactEmail)) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      // Replace with actual form submission / API call
      showToast('🎉 Demo request received! Our team will contact you within 24 hours.', 'success');
      demoForm.reset();
    });
  }

  /* ─── Toast Helper ────────────────────────────────── */
  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:' + (type === 'error' ? '#ef4444' : '#16a34a'),
      'color:#fff',
      'padding:14px 24px',
      'border-radius:12px',
      'font-family:Poppins,sans-serif',
      'font-size:0.9rem',
      'font-weight:500',
      'z-index:9999',
      'box-shadow:0 8px 24px rgba(0,0,0,0.2)',
      'max-width:90vw',
      'text-align:center',
      'transition:opacity 0.4s ease',
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 400);
    }, 4000);
  }

  /* ─── Email Validator ─────────────────────────────── */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ─── Smooth Scroll for anchor links ─────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});

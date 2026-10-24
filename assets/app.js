
document.addEventListener("DOMContentLoaded", () => {
    const isDesktop = window.matchMedia("(pointer: fine)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isDesktop && !prefersReduced) {
        const dot = document.createElement('div'); dot.className = 'cursor-dot';
        const ring = document.createElement('div'); ring.className = 'cursor-ring';
        document.body.appendChild(dot); document.body.appendChild(ring);
        let mX = 0, mY = 0, rX = 0, rY = 0;
        window.addEventListener('mousemove', (e) => {
            mX = e.clientX; mY = e.clientY;
            dot.style.transform = `translate(${mX}px, ${mY}px) translate(-50%, -50%)`;
        });
        function animate() {
            rX += (mX - rX) * 0.15; rY += (mY - rY) * 0.15;
            ring.style.transform = `translate(${rX}px, ${rY}px) translate(-50%, -50%)`;
            requestAnimationFrame(animate);
        }
        animate();
        document.querySelectorAll('a, button, .card, tr').forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });
    }
    
    if (!prefersReduced) {
        const lenis = new Lenis({ duration: 1.1, smoothTouch: false });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
    }
    
    const reveals = document.querySelectorAll(".reveal");
    if (reveals.length > 0 && !prefersReduced) {
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        reveals.forEach(function(el) { observer.observe(el); });
    } else {
        reveals.forEach(function(el) { el.classList.add("active"); });
    }
});

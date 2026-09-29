/**
 * ==========================================================================
 * GAMEZONE STORE - LÓGICA DE INTERACCIÓN Y FILTRADO
 * ==========================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-pill');
    const categorySections = document.querySelectorAll('.category-section');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');

            // Actualizar estado visual de los pills
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');

            // Filtrar o mostrar secciones correspondientes
            if (filter === 'all') {
                categorySections.forEach(section => {
                    section.style.display = 'block';
                    section.style.opacity = '1';
                });
            } else {
                categorySections.forEach(section => {
                    const sectionCategory = section.getAttribute('data-category');
                    if (sectionCategory === filter) {
                        section.style.display = 'block';
                        section.style.opacity = '1';
                        // Desplazamiento suave hacia la sección seleccionada
                        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        section.style.display = 'none';
                    }
                });
            }
        });
    });
});

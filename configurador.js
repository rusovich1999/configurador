// PC Configurator JavaScript
class PCConfigurator {
    constructor() {
        this.selectedComponents = {};
        this.totalPrice = 0;
        this.componentTypes = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'case'];
        this.compatibilityRules = this.initCompatibilityRules();
        this.initEventListeners();
        this.updateProgress();
    }

    // Inicializar event listeners
    initEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Component selection
        document.querySelectorAll('.component-card').forEach(card => {
            card.addEventListener('click', (e) => this.selectComponent(e.currentTarget));
        });

        // Save and share buttons
        document.getElementById('save-build').addEventListener('click', () => this.saveBuild());
        document.getElementById('share-build').addEventListener('click', () => this.shareBuild());

        // FAB click
        document.getElementById('fab').addEventListener('click', () => this.switchTab('resumen'));

        // Touch events for mobile
        this.initTouchEvents();
    }

    // Inicializar eventos táctiles para móviles
    initTouchEvents() {
        let touchStartY = 0;
        let touchEndY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        }, { passive: true });

        const handleSwipe = () => {
            const swipeThreshold = 50;
            const swipeDistance = touchStartY - touchEndY;

            if (Math.abs(swipeDistance) > swipeThreshold) {
                if (swipeDistance > 0) {
                    // Swipe up - show summary
                    this.switchTab('resumen');
                }
            }
        };

        this.handleSwipe = handleSwipe;
    }

    // Cambiar pestañas
    switchTab(tabName) {
        // Remover clase active de todos los botones y contenidos
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Agregar clase active al botón y contenido seleccionado
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');

        // Actualizar compatibilidad si es esa pestaña
        if (tabName === 'compatibilidad') {
            this.updateCompatibility();
        }
    }

    // Seleccionar componente
    selectComponent(card) {
        const componentType = card.dataset.component;
        const componentName = card.dataset.name;
        const componentPrice = parseInt(card.dataset.price);

        // Remover selección previa del mismo tipo
        document.querySelectorAll(`[data-component="${componentType}"]`).forEach(c => {
            c.classList.remove('selected');
        });

        // Agregar selección al componente actual
        card.classList.add('selected', 'selecting');
        
        // Remover clase de animación después de la animación
        setTimeout(() => {
            card.classList.remove('selecting');
        }, 500);

        // Actualizar componente seleccionado
        this.selectedComponents[componentType] = {
            name: componentName,
            price: componentPrice,
            element: card
        };

        // Actualizar precio total y progreso
        this.updateTotalPrice();
        this.updateProgress();
        this.updateSummary();
        this.updateFAB();

        // Mostrar toast
        this.showToast(`${componentName} seleccionado`);

        // Vibración en móviles
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    // Actualizar precio total
    updateTotalPrice() {
        this.totalPrice = Object.values(this.selectedComponents)
            .reduce((total, component) => total + component.price, 0);
        
        document.getElementById('total-price').textContent = this.totalPrice;
    }

    // Actualizar barra de progreso
    updateProgress() {
        const selectedCount = Object.keys(this.selectedComponents).length;
        const totalComponents = this.componentTypes.length;
        const progressPercentage = (selectedCount / totalComponents) * 100;
        
        document.querySelector('.progress-fill').style.width = `${progressPercentage}%`;
    }

    // Actualizar resumen
    updateSummary() {
        const selectedList = document.getElementById('selected-components');
        const saveBtn = document.getElementById('save-build');
        const shareBtn = document.getElementById('share-build');

        if (Object.keys(this.selectedComponents).length === 0) {
            selectedList.innerHTML = '<p class="empty-state">Selecciona componentes para ver tu configuración</p>';
            saveBtn.disabled = true;
            shareBtn.disabled = true;
            return;
        }

        let html = '';
        Object.entries(this.selectedComponents).forEach(([type, component]) => {
            html += `
                <div class="selected-item">
                    <div class="selected-item-info">
                        <h4>${this.getComponentTypeLabel(type)}</h4>
                        <p>${component.name}</p>
                    </div>
                    <div class="selected-item-price">$${component.price}</div>
                </div>
            `;
        });

        selectedList.innerHTML = html;
        saveBtn.disabled = false;
        shareBtn.disabled = false;
    }

    // Actualizar FAB
    updateFAB() {
        const counter = document.querySelector('.fab-counter');
        const selectedCount = Object.keys(this.selectedComponents).length;
        counter.textContent = selectedCount;
        
        if (selectedCount > 0) {
            counter.style.display = 'flex';
        } else {
            counter.style.display = 'none';
        }
    }

    // Obtener etiqueta del tipo de componente
    getComponentTypeLabel(type) {
        const labels = {
            cpu: 'Procesador',
            gpu: 'Tarjeta Gráfica',
            ram: 'Memoria RAM',
            storage: 'Almacenamiento',
            motherboard: 'Placa Madre',
            psu: 'Fuente de Poder',
            case: 'Gabinete'
        };
        return labels[type] || type;
    }

    // Mostrar toast
    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Guardar configuración
    saveBuild() {
        const buildData = {
            components: this.selectedComponents,
            totalPrice: this.totalPrice,
            timestamp: new Date().toISOString()
        };

        try {
            localStorage.setItem('pc-configurator-build', JSON.stringify(buildData));
            this.showToast('Configuración guardada exitosamente');
        } catch (error) {
            this.showToast('Error al guardar la configuración');
        }
    }

    // Compartir configuración
    async shareBuild() {
        const buildText = this.generateBuildText();
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Mi Configuración de PC',
                    text: buildText,
                    url: window.location.href
                });
            } catch (error) {
                this.fallbackShare(buildText);
            }
        } else {
            this.fallbackShare(buildText);
        }
    }

    // Compartir alternativo
    fallbackShare(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Configuración copiada al portapapeles');
            }).catch(() => {
                this.showToast('Error al copiar la configuración');
            });
        } else {
            // Fallback para navegadores antiguos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Configuración copiada al portapapeles');
        }
    }

    // Generar texto de la configuración
    generateBuildText() {
        let text = '🖥️ Mi Configuración de PC\n\n';
        
        Object.entries(this.selectedComponents).forEach(([type, component]) => {
            text += `${this.getComponentTypeLabel(type)}: ${component.name} - $${component.price}\n`;
        });
        
        text += `\n💰 Total: $${this.totalPrice}`;
        text += '\n\n🔧 Generado con el Configurador de PC';
        
        return text;
    }

    // Inicializar reglas de compatibilidad
    initCompatibilityRules() {
        return {
            // Compatibilidad CPU-Motherboard
            cpuMotherboard: {
                'Intel Core i5-13400F': ['Gigabyte Z790M'],
                'Intel Core i7-13700F': ['Gigabyte Z790M'],
                'AMD Ryzen 5 7600': ['MSI B550M PRO', 'ASUS ROG B650M']
            },
            
            // Compatibilidad RAM-Motherboard
            ramMotherboard: {
                'MSI B550M PRO': ['16GB DDR4-3200', '32GB DDR4-3600'],
                'ASUS ROG B650M': ['32GB DDR5-5600'],
                'Gigabyte Z790M': ['32GB DDR5-5600']
            },
            
            // Requerimientos mínimos de PSU
            powerRequirements: {
                'RTX 4060 Ti 16GB': 550,
                'RTX 4070 Super': 650,
                'RX 7600 XT': 600
            }
        };
    }

    // Actualizar compatibilidad
    updateCompatibility() {
        const statusContainer = document.getElementById('compatibility-status');
        const recommendationsContainer = document.getElementById('recommendations-list');
        
        let statusHTML = '';
        let recommendationsHTML = '';
        
        if (Object.keys(this.selectedComponents).length === 0) {
            statusHTML = `
                <div class="status-item">
                    <i class="fas fa-info-circle"></i>
                    <p>Selecciona componentes para verificar compatibilidad</p>
                </div>
            `;
            recommendationsHTML = '<p>Las recomendaciones aparecerán aquí basadas en tu selección</p>';
        } else {
            const compatibility = this.checkCompatibility();
            
            // Mostrar estado de compatibilidad
            if (compatibility.compatible) {
                statusHTML += `
                    <div class="status-item success">
                        <i class="fas fa-check-circle"></i>
                        <p>✅ Todos los componentes son compatibles</p>
                    </div>
                `;
            } else {
                compatibility.issues.forEach(issue => {
                    statusHTML += `
                        <div class="status-item error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>❌ ${issue}</p>
                        </div>
                    `;
                });
            }
            
            // Mostrar advertencias
            compatibility.warnings.forEach(warning => {
                statusHTML += `
                    <div class="status-item warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>⚠️ ${warning}</p>
                    </div>
                `;
            });
            
            // Generar recomendaciones
            const recommendations = this.generateRecommendations();
            if (recommendations.length > 0) {
                recommendations.forEach(rec => {
                    recommendationsHTML += `
                        <div class="recommendation-item">
                            💡 ${rec}
                        </div>
                    `;
                });
            } else {
                recommendationsHTML = '<p>No hay recomendaciones adicionales para tu configuración actual.</p>';
            }
        }
        
        statusContainer.innerHTML = statusHTML;
        recommendationsContainer.innerHTML = recommendationsHTML;
    }

    // Verificar compatibilidad
    checkCompatibility() {
        const issues = [];
        const warnings = [];
        let compatible = true;
        
        const { cpu, motherboard, ram, gpu, psu } = this.selectedComponents;
        
        // Verificar compatibilidad CPU-Motherboard
        if (cpu && motherboard) {
            const compatibleBoards = this.compatibilityRules.cpuMotherboard[cpu.name];
            if (compatibleBoards && !compatibleBoards.includes(motherboard.name)) {
                issues.push(`El ${cpu.name} no es compatible con la ${motherboard.name}`);
                compatible = false;
            }
        }
        
        // Verificar compatibilidad RAM-Motherboard
        if (ram && motherboard) {
            const compatibleRAM = this.compatibilityRules.ramMotherboard[motherboard.name];
            if (compatibleRAM && !compatibleRAM.includes(ram.name)) {
                issues.push(`La ${ram.name} no es compatible con la ${motherboard.name}`);
                compatible = false;
            }
        }
        
        // Verificar capacidad de la fuente
        if (gpu && psu) {
            const requiredPower = this.compatibilityRules.powerRequirements[gpu.name];
            const psuWattage = parseInt(psu.name.match(/(\d+)W/)[1]);
            
            if (requiredPower && psuWattage < requiredPower) {
                issues.push(`La fuente de ${psuWattage}W es insuficiente para la ${gpu.name} (requiere ${requiredPower}W mínimo)`);
                compatible = false;
            } else if (requiredPower && psuWattage < requiredPower + 100) {
                warnings.push(`Se recomienda una fuente de mayor capacidad para mejor eficiencia`);
            }
        }
        
        // Verificar componentes faltantes
        const missingComponents = this.componentTypes.filter(type => !this.selectedComponents[type]);
        if (missingComponents.length > 0) {
            warnings.push(`Faltan componentes: ${missingComponents.map(type => this.getComponentTypeLabel(type)).join(', ')}`);
        }
        
        return { compatible, issues, warnings };
    }

    // Generar recomendaciones
    generateRecommendations() {
        const recommendations = [];
        const { cpu, gpu, ram, storage } = this.selectedComponents;
        
        // Recomendaciones basadas en GPU
        if (gpu) {
            if (gpu.name.includes('RTX 4070') && (!ram || !ram.name.includes('32GB'))) {
                recommendations.push('Para gaming en 4K con RTX 4070, se recomienda 32GB de RAM');
            }
            
            if (gpu.name.includes('RTX') && (!storage || !storage.name.includes('NVMe'))) {
                recommendations.push('Los juegos modernos con Ray Tracing se benefician de almacenamiento NVMe rápido');
            }
        }
        
        // Recomendaciones basadas en CPU
        if (cpu) {
            if (cpu.name.includes('i7') && (!ram || ram.name.includes('16GB'))) {
                recommendations.push('Un procesador i7 funciona mejor con 32GB de RAM para multitarea');
            }
        }
        
        // Recomendaciones de almacenamiento
        if (storage && storage.name.includes('1TB') && gpu && gpu.name.includes('RTX')) {
            recommendations.push('Considera 2TB o más para juegos modernos que requieren mucho espacio');
        }
        
        // Recomendaciones de refrigeración
        if (cpu && cpu.name.includes('i7')) {
            recommendations.push('Los procesadores i7 generan calor, asegúrate de tener buena refrigeración');
        }
        
        return recommendations;
    }

    // Cargar configuración guardada
    loadSavedBuild() {
        try {
            const savedBuild = localStorage.getItem('pc-configurator-build');
            if (savedBuild) {
                const buildData = JSON.parse(savedBuild);
                // Aquí podrías implementar la carga de la configuración guardada
                this.showToast('Configuración anterior cargada');
            }
        } catch (error) {
            console.error('Error loading saved build:', error);
        }
    }
}

// Inicializar el configurador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const configurator = new PCConfigurator();
    
    // Registrar Service Worker para PWA (opcional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker no disponible, continuar sin él
        });
    }
    
    // Manejar orientación en móviles
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            // Recalcular layouts después del cambio de orientación
            configurator.updateProgress();
        }, 100);
    });
    
    // Manejar redimensionamiento de ventana
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            configurator.updateProgress();
        }, 150);
    });
    
    // Manejar visibilidad de la página (para ahorrar batería en móviles)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pausar animaciones si es necesario
        } else {
            // Reanudar animaciones
            configurator.updateProgress();
        }
    });
});

// Funciones de utilidad global
window.PCConfiguratorUtils = {
    // Formatear precio
    formatPrice: (price) => {
        return new Intl.NumberFormat('es-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    },
    
    // Detectar dispositivo móvil
    isMobile: () => {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // Generar ID único
    generateId: () => {
        return Math.random().toString(36).substr(2, 9);
    }
};
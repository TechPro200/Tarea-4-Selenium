const { Builder, By, until, Key } = require('selenium-webdriver');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

// Configura la ruta a tu ChromeDriver.exe
// Reemplaza esto con la ruta de tu propio archivo
const chromeDriverPath = './chromedriver.exe';
const service = new ServiceBuilder(chromeDriverPath);

describe('Funcionalidad de Inicio de Sesión en Timecamp', function() {
    let driver;

    // Aumentamos el timeout general para las pruebas
    this.timeout(60000);

    before(async () => {
        // Inicializamos el driver de Chrome
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .build();
    });

    after(async () => {
        // Cerramos el navegador al finalizar la prueba
        if (driver) await driver.quit();
    });

    // Función auxiliar para tomar capturas de pantalla
    const takeScreenshot = async (name) => {
        try {
            const image = await driver.takeScreenshot();
            const screenshotDir = 'screenshots';
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir);
            }
            const screenshotPath = path.join(screenshotDir, `${name}.png`);
            fs.writeFileSync(screenshotPath, image, 'base64');
            console.log(`  📸 Captura de pantalla guardada: ${screenshotPath}`);
        } catch (error) {
            console.error(`  ⚠️ Error al tomar captura de pantalla ${name}:`, error);
        }
    };

    it('Debe iniciar sesión correctamente en Timecamp', async function() {
        console.log('\n--- INICIANDO PRUEBA DE LOGIN EN TIMECAMP ---');

        // --- Paso 1: Navegar a la página de login de Timecamp ---
        await driver.get('https://app.timecamp.com/auth/login');
        console.log('✅ Navegando a la página de inicio de sesión de Timecamp.');

        // --- Paso 2: Localizar y rellenar los campos de usuario y contraseña ---
        console.log('🔍 Localizando campos de email y contraseña...');
        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 15000);
        const passwordInput = await driver.wait(until.elementLocated(By.id('pass_hash')), 15000);
        
        // Credenciales de acceso
        await emailInput.sendKeys('penp57981@gmail.com');
        await passwordInput.sendKeys('Preubatarea4...');
        console.log('✅ Credenciales de acceso introducidas.');
        await takeScreenshot('01-login-form-filled');

        // --- Paso 3: Hacer clic en el botón de "Login" ---
        console.log('🔍 Localizando y haciendo clic en el botón de inicio de sesión...');
        const loginButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 10000);
        await loginButton.click();
        console.log('✅ Clic en el botón "Log In".');

        // --- Paso 4: Verificar que el inicio de sesión fue exitoso ---
        console.log('🔍 Verificando el inicio de sesión y la carga de la página principal...');
        
        // Espera a que la URL cambie a la página de destino
        await driver.wait(until.urlContains('https://app.timecamp.com/app#/timesheets/timer'), 20000);
        
        // Ahora, verificamos el título de la página
        const pageTitle = await driver.getTitle();
        expect(pageTitle).to.include('Timer Timesheet | TimeCamp');
        console.log('✅ Inicio de sesión exitoso. Se ha llegado al dashboard y el título de la página es el esperado.');
        await takeScreenshot('02-successful-login');
        
        console.log('--- PRUEBA DE LOGIN EN TIMECAMP FINALIZADA CON ÉXITO ---');
    });
});

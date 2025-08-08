const { Builder, By, until } = require('selenium-webdriver');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

// Configura la ruta a tu ChromeDriver.exe
const chromeDriverPath = './chromedriver.exe';
const service = new ServiceBuilder(chromeDriverPath);

describe('Funcionalidad de Creación de Proyecto en Timecamp', function() {
    let driver;

    // Aumentamos el timeout general para las pruebas
    this.timeout(90000); // 90 segundos

    before(async () => {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .build();
    });

    after(async () => {
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

    it('Debe iniciar sesión y crear un nuevo proyecto con éxito', async function() {
        console.log('\n--- INICIANDO PRUEBA DE CREACIÓN DE PROYECTO EN TIMECAMP ---');

        // Paso 1: Navegar a la página de login de Timecamp
        await driver.get('https://app.timecamp.com/auth/login');
        console.log('✅ Navegando a la página de inicio de sesión de Timecamp.');

        // Paso 2: Localizar y rellenar los campos de usuario y contraseña
        console.log('🔍 Localizando campos de email y contraseña...');
        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 15000);
        const passwordInput = await driver.wait(until.elementLocated(By.id('pass_hash')), 15000);
        
        await emailInput.sendKeys('penp57981@gmail.com');
        await passwordInput.sendKeys('Preubatarea4...');
        console.log('✅ Credenciales de acceso introducidas.');
        await takeScreenshot('01-login-form-filled');

        // Paso 3: Hacer clic en el botón de "Login"
        console.log('🔍 Localizando y haciendo clic en el botón de inicio de sesión...');
        const loginButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 10000);
        await loginButton.click();
        console.log('✅ Clic en el botón "Log In".');

        // Paso 4: Verificar que el inicio de sesión fue exitoso
        console.log('🔍 Verificando el inicio de sesión y la carga de la página principal...');
        await driver.wait(until.urlContains('https://app.timecamp.com/app#/timesheets/timer'), 30000);
        const pageTitle = await driver.getTitle();
        expect(pageTitle).to.include('Timer Timesheet | TimeCamp');
        console.log('✅ Inicio de sesión exitoso. Se ha llegado al dashboard.');
        await takeScreenshot('02-successful-login');

        // Paso 5: Navegar a la página de proyectos (click dentro del shadow root)
        console.log('🔍 Navegando a la sección de Proyectos...');

        await driver.executeScript(`
          const mainMenuDiv = document.querySelector('div#main-menu-v');
          if (!mainMenuDiv) throw new Error('No existe div#main-menu-v');
          
          const sidebar = mainMenuDiv.querySelector('web-main-sidebar');
          if (!sidebar) throw new Error('No existe web-main-sidebar');
          
          const shadowRoot = sidebar.shadowRoot;
          if (!shadowRoot) throw new Error('No existe shadowRoot en web-main-sidebar');
          
          const projectsLink = shadowRoot.querySelector('a[href="/time_tracking/manage"]');
          if (!projectsLink) throw new Error('No se encontró enlace de proyectos');
          
          projectsLink.click();
        `);

        await driver.wait(until.urlContains('https://app.timecamp.com/time_tracking/manage'), 30000);
        console.log('✅ Se ha llegado a la página de Proyectos.');
        await takeScreenshot('04-projects-page');

        // Paso 6: Hacer clic en el botón "New project" con espera mejorada
        console.log('🔍 Haciendo clic en el botón "New project"...');
        const newProjectButton = await driver.wait(until.elementLocated(By.css('#newTaskBtn')), 15000);

        await driver.wait(async () => {
            const displayed = await newProjectButton.isDisplayed();
            const pointerEvents = await driver.executeScript(
                'return window.getComputedStyle(arguments[0]).getPropertyValue("pointer-events");',
                newProjectButton
            );
            return displayed && pointerEvents !== 'none';
        }, 15000, 'El botón "New project" no está listo para interactuar');

        await newProjectButton.click();
        console.log('✅ Clic en "New project".');

        // Paso 7: Rellenar el nombre del proyecto
        const projectName = 'Prueba-test1';
        console.log(`✍️ Rellenando el nombre del proyecto: "${projectName}"...`);
        const projectNameInput = await driver.wait(until.elementLocated(By.id('new-task-name-input')), 10000);
        await projectNameInput.sendKeys(projectName);
        console.log('✅ Nombre del proyecto introducido.');
        await takeScreenshot('05-new-project-input-filled');

        // Paso 8: Hacer clic en el botón "Create new project"
        console.log('🔍 Haciendo clic en el botón para crear el proyecto...');
        const createProjectButton = await driver.wait(until.elementLocated(By.css('[data-testid="new-task-btn-apply"]')), 10000);
        await createProjectButton.click();
        console.log('✅ Clic en "Create new project".');

        // Paso 9: Verificar que el proyecto se creó correctamente
        console.log('🔍 Verificando que el proyecto aparezca en la lista...');
        const createdProject = await driver.wait(until.elementLocated(By.xpath(`//span[text()="${projectName}"]`)), 20000);
        expect(await createdProject.isDisplayed()).to.be.true;
        console.log(`✅ Verificación exitosa. El proyecto "${projectName}" es visible en la lista.`);
        await takeScreenshot('06-project-created');

        console.log('--- PRUEBA DE CREACIÓN DE PROYECTO EN TIMECAMP FINALIZADA CON ÉXITO ---');
    });
});

const { Builder, By, until, Key } = require('selenium-webdriver');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

const chromeDriverPath = './chromedriver.exe';
const service = new ServiceBuilder(chromeDriverPath);

// Función para pausar en milisegundos
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('Funcionalidad de Edición de Proyecto en Timecamp', function() {
    let driver;

    this.timeout(120000); // 2 minutos para más margen

    before(async () => {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .build();
    });

    after(async () => {
        if (driver) await driver.quit();
    });

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

    it('Debe editar el primer proyecto visible correctamente con pausas', async function() {
        console.log('\n--- INICIANDO PRUEBA DE EDICIÓN DE PROYECTO ---');

        // Paso 1: Iniciar sesión
        await driver.get('https://app.timecamp.com/auth/login');
        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 15000);
        const passwordInput = await driver.wait(until.elementLocated(By.id('pass_hash')), 15000);
        await emailInput.sendKeys('penp57981@gmail.com');
        await passwordInput.sendKeys('Preubatarea4...');
        const loginButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 10000);
        await loginButton.click();

        await driver.wait(until.urlContains('https://app.timecamp.com/app#/timesheets/timer'), 20000);
        console.log('✅ Inicio de sesión exitoso.');
        await sleep(2000);

        // Paso 2: Navegar a proyectos (click en link dentro del sidebar)
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
        await driver.wait(until.urlContains('/time_tracking/manage'), 15000);
        console.log('✅ Se ha llegado a la página de Proyectos.');
        await takeScreenshot('projects-page-before-edit');
        await sleep(2000);

        // Paso 3: Hacer click en el primer div clickeable de proyecto para abrir menú lateral
        const firstProjectDiv = await driver.wait(
            until.elementLocated(By.css('div.tc-ui-task-name.tc-ui-task-name-clickable')),
            15000
        );
        await firstProjectDiv.click();
        console.log('✅ Se hizo click en el primer proyecto para abrir menú.');
        await sleep(1500);

        // Paso 4: Hacer click en el botón con data-testid="view-more-actions" para abrir menú desplegable
        const menuButton = await driver.wait(
            until.elementLocated(By.css('button[data-testid="view-more-actions"]')),
            10000
        );
        await menuButton.click();
        console.log('✅ Se hizo click en el botón de más acciones para desplegar menú.');
        await sleep(1500);  // Pausa para que el menú se despliegue

        // Paso 5: Esperar el input para editar nombre y cambiar el nombre agregando "2"
        const projectNameInput = await driver.wait(
            until.elementLocated(By.css('input.form-control.tc-form-control.editTaskBox-name')),
            15000
        );
        const currentName = await projectNameInput.getAttribute('value');
        const newName = currentName + '2';
        await projectNameInput.clear();
        await projectNameInput.sendKeys(newName);
        console.log(`✍️ Cambiado nombre proyecto de "${currentName}" a "${newName}".`);
        await sleep(2000);

        // Paso 6: Localizar el botón guardar y hacer clic
        const saveBtn = await driver.wait(
            until.elementLocated(By.css('a.btn.tc-btn.btn-success.editTaskBox-addBtn[data-testid="manage-project-save-link"]')),
            15000
        );
        await saveBtn.click();
        console.log('✅ Clic en botón "Save".');

        // Paso 7: Esperar que el texto del botón cambie a "Saving..." y luego vuelva a "Save"
        await driver.wait(async () => {
            const text = await saveBtn.getText();
            return text.toLowerCase().includes('saving');
        }, 10000);

        await driver.wait(async () => {
            const text = await saveBtn.getText();
            return text.toLowerCase().includes('save');
        }, 10000);

        console.log('✅ Proyecto guardado exitosamente.');
        await takeScreenshot('project-edited');

        console.log('--- PRUEBA DE EDICIÓN DE PROYECTO FINALIZADA ---');
    });
});

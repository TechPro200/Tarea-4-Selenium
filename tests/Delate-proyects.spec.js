const { Builder, By, until, Key } = require('selenium-webdriver');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

const chromeDriverPath = './chromedriver.exe';
const service = new ServiceBuilder(chromeDriverPath);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('Funcionalidad de Eliminación de Proyecto en Timecamp', function() {
    let driver;

    this.timeout(120000); // 2 minutos

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

    it('Debe eliminar el primer proyecto visible correctamente', async function() {
        console.log('\n--- INICIANDO PRUEBA DE ELIMINACIÓN DE PROYECTO ---');

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

        // Paso 2: Navegar a proyectos
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
        await takeScreenshot('projects-page-before-delete');
        await sleep(2000);

        // Paso 3: Hacer click en el primer proyecto para abrir menú lateral
        const firstProjectDiv = await driver.wait(
            until.elementLocated(By.css('div.tc-ui-task-name.tc-ui-task-name-clickable')),
            15000
        );
        await firstProjectDiv.click();
        console.log('✅ Se hizo click en el primer proyecto para abrir menú lateral.');
        await sleep(1500);

        // Paso 4: Hacer click en el botón con data-testid="view-more-actions" para abrir menú desplegable
        const menuButton = await driver.wait(
            until.elementLocated(By.css('button[data-testid="view-more-actions"]')),
            10000
        );
        await menuButton.click();
        console.log('✅ Se hizo click en el botón de más acciones para desplegar menú.');
        await sleep(1500);
        await takeScreenshot('menu-more-actions-opened');

        // Paso 5: Hacer click en el enlace "Delete" dentro del menú desplegable
        const deleteLink = await driver.wait(
            until.elementLocated(By.css('a.task-btn-delete[data-testid="project-action-delete"]')),
            10000
        );
        await deleteLink.click();
        console.log('✅ Se hizo click en "Delete" para abrir modal de confirmación.');
        await sleep(1500);
        await takeScreenshot('delete-modal-opened');

        // Paso 6: En el modal, hacer click en el botón "Delete project" para confirmar
        const confirmDeleteBtn = await driver.wait(
            until.elementLocated(By.css('button.btn.btn-success[data-bb-handler="confirm"]')),
            10000
        );
        await confirmDeleteBtn.click();
        console.log('✅ Se hizo click en "Delete project" para confirmar la eliminación.');
        await sleep(3000); // Pausa para que se complete la eliminación
        await takeScreenshot('project-deleted');

        console.log('--- PRUEBA DE ELIMINACIÓN DE PROYECTO FINALIZADA ---');
    });
});

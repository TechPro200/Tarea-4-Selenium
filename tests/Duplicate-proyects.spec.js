const { Builder, By, until, Key } = require('selenium-webdriver');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

const chromeDriverPath = './chromedriver.exe';
const service = new ServiceBuilder(chromeDriverPath);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('Funcionalidad de Duplicación de Proyecto en Timecamp', function() {
    let driver;

    this.timeout(120000); 

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
            console.log(`Captura de pantalla guardada: ${screenshotPath}`);
        } catch (error) {
            console.error(`Error al tomar captura de pantalla ${name}:`, error);
        }
    };

    it('Debe duplicar el primer proyecto visible correctamente', async function() {
        console.log('\n--- INICIANDO PRUEBA DE DUPLICACIÓN DE PROYECTO ---');

       
        await driver.get('https://app.timecamp.com/auth/login');
        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 15000);
        const passwordInput = await driver.wait(until.elementLocated(By.id('pass_hash')), 15000);
        await emailInput.sendKeys('penp57981@gmail.com');
        await passwordInput.sendKeys('Preubatarea4...');
        const loginButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 10000);
        await loginButton.click();

        await driver.wait(until.urlContains('https://app.timecamp.com/app#/timesheets/timer'), 20000);
        console.log('Inicio de sesión exitoso.');
        await sleep(2000);

 
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
        console.log('Se ha llegado a la página de Proyectos.');
        await takeScreenshot('01-projects-page-before-duplicate');
        await sleep(2000);


        const firstProjectDiv = await driver.wait(
            until.elementLocated(By.css('div.tc-ui-task-name.tc-ui-task-name-clickable')),
            15000
        );
        await firstProjectDiv.click();
        console.log('Se hizo click en el primer proyecto para abrir menú lateral.');
        await takeScreenshot('02-project-menu-opened');
        await sleep(1500);

        const menuButton = await driver.wait(
            until.elementLocated(By.css('button[data-testid="view-more-actions"]')),
            10000
        );
        await menuButton.click();
        console.log('Se hizo click en el botón de más acciones para desplegar menú.');
        await sleep(1500);
        await takeScreenshot('03-menu-more-actions-opened');


        const duplicateLink = await driver.wait(
            until.elementLocated(By.css('a.task-btn-clone[style*="display: block"]')),
            10000
        );
        await duplicateLink.click();
        console.log('Se hizo click en "Duplicate" para abrir modal de confirmación.');
        await sleep(1500);
        await takeScreenshot('04-duplicate-modal-opened');


        const confirmDuplicateBtn = await driver.wait(
            until.elementLocated(By.css('button.btn.btn-success[data-bb-handler="confirm"]')),
            10000
        );
        await confirmDuplicateBtn.click();
        console.log('Se hizo click en "OK" para confirmar duplicación.');
        await sleep(3000); 
        await takeScreenshot('05-project-duplicated');

        console.log('--- PRUEBA DE DUPLICACIÓN DE PROYECTO FINALIZADA ---');
    });
});

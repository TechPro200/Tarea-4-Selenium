const { Builder, By, until, Key } = require('selenium-webdriver');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');


const chromeDriverPath = './chromedriver.exe';
const service = new ServiceBuilder(chromeDriverPath);

describe('Funcionalidad de Inicio de Sesión en Timecamp', function() {
    let driver;

    this.timeout(60000);

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
            console.log(`Captura guardada: ${screenshotPath}`);
        } catch (error) {
            console.error(`Error al tomar captura ${name}:`, error);
        }
    };

        it('Camino fallido: credenciales incorrectas', async function() {
        console.log('\n--- PRUEBA LOGIN FALLIDO ---');

        await driver.get('https://app.timecamp.com/auth/login');

        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 15000);
        const passwordInput = await driver.wait(until.elementLocated(By.id('pass_hash')), 15000);

        await emailInput.sendKeys('usuario_inexistente@mail.com');
        await passwordInput.sendKeys('ClaveIncorrecta123');
        await takeScreenshot('01-login-invalid-filled');

        const loginButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 10000);
        await loginButton.click();

        const errorElement = await driver.wait(
            until.elementLocated(By.css('.FormField__error-message-text.whitespace-break-spaces')),
            10000
        );

        const errorText = await errorElement.getText();
        expect(errorText.trim()).to.include('email and password combination is incorrect');
        await takeScreenshot('02-login-failed-message');

        console.log(`Login fallido como se esperaba. Mensaje mostrado: "${errorText}"`);
    });

    it('Debe iniciar sesión correctamente en Timecamp (camino feliz)', async function() {
        console.log('\n--- PRUEBA LOGIN EXITOSO ---');

        await driver.get('https://app.timecamp.com/auth/login');

        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 15000);
        const passwordInput = await driver.wait(until.elementLocated(By.id('pass_hash')), 15000);

        await emailInput.sendKeys('penp57981@gmail.com');
        await passwordInput.sendKeys('Preubatarea4...');
        await takeScreenshot('01-login-form-filled');

        const loginButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 10000);
        await loginButton.click();

        await driver.wait(until.urlContains('https://app.timecamp.com/app#/timesheets/timer'), 20000);

        const pageTitle = await driver.getTitle();
        expect(pageTitle).to.include('Timer Timesheet | TimeCamp');
        await takeScreenshot('02-successful-login');

        console.log('Inicio de sesión exitoso.');
    });
});

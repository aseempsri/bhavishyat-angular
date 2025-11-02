# BhavishyatAngular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## GitHub Pages Deployment

This project is configured with GitHub Actions to automatically deploy to GitHub Pages when you push to the `main` branch.

### Setup Instructions:

1. **Create a GitHub repository:**
   - Go to [GitHub](https://github.com/new) and create a new repository
   - Don't initialize it with a README, .gitignore, or license (we already have these)

2. **Add the remote and push:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   git push -u origin main
   ```

3. **Enable GitHub Pages:**
   - Go to your repository Settings → Pages
   - Under "Source", select "GitHub Actions"
   - Save the settings

4. **Automatic Deployment:**
   - After pushing, GitHub Actions will automatically build and deploy your app
   - The deployment will appear in the Actions tab
   - Once complete, your site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/`

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:
- Build your Angular app on every push to `main` branch
- Deploy it to GitHub Pages
- Make it publicly accessible

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

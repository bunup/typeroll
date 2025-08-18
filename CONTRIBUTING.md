# Contributing to typeroll

Thank you for your interest in contributing to our project! This guide will help you get started with the development process.

📖 **[Learn how typeroll works under the hood](./guides/how-it-works.md)**

## Development Setup

### Prerequisites

- Bun installed on your system

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/arshad-yaseen/typeroll.git`
3. Navigate to the project directory: `cd typeroll`
4. Install dependencies: `bun install`
5. Start development: `bun run dev`

## Development Workflow

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Format your code: `bun run format`
4. Run linting: `bun run lint`
5. Run tests: `bun run test`
6. Build the project: `bun run build`
7. Commit your changes using the conventions below
8. Push your branch to your fork
9. Open a pull request

## Testing Your Changes

To test your bug fixes or new features, you have two options:

1. **Unit/Integration Tests**: Add tests in `tests/specs` for your specific changes and run `bun run test`
2. **Manual Testing**: Add test files in `tests/fixtures` with an entry point at `index.ts`, then check `play.ts` and run `bun run play` which will run typeroll bundling with `tests/fixtures/index.ts` as the entry point

## Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear and structured commit messages:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code changes that neither fix bugs nor add features
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependencies, etc.

## Pull Request Guidelines

1. Update documentation if needed
2. Ensure all tests pass
3. Address any feedback from code reviews
4. Once approved, your PR will be merged

## Code of Conduct

Please be respectful and constructive in all interactions within our community.

## Questions?

If you have any questions, please open an issue for discussion.

Thank you for contributing to typeroll!

# Contributing to GenieNotes Documentation

Thank you for your interest in contributing to GenieNotes! This guide explains how to help maintain our living documentation system.

## 📚 **Documentation Philosophy**

GenieNotes uses a **living documentation system** that automatically stays in sync with development. Our goal is to have documentation that is:

- **Always Current**: Reflects the current state of the application
- **Comprehensive**: Covers every aspect of the system
- **Easy to Navigate**: Well-organized and cross-referenced
- **Developer-Friendly**: Helps developers understand and contribute

## 🔄 **When to Update Documentation**

### **Always Update When:**
- Adding new features or functionality
- Changing the architecture or data models
- Modifying UI/UX components or design
- Updating development workflow or processes
- Fixing bugs or implementing improvements
- Changing project plans or roadmap

### **Update These Files:**
- **`FEATURES.md`**: New features, changed functionality
- **`ARCHITECTURE.md`**: Technical changes, data model updates
- **`UI-UX.md`**: Design changes, new components
- **`DEVELOPMENT.md`**: Process changes, new tools
- **`CHANGELOG.md`**: All changes (auto-updated)
- **`ROADMAP.md`**: Plan changes, milestone updates
- **`README.md`**: High-level changes, new capabilities

## 🛠️ **Documentation Update Workflow**

### **1. Before Making Changes**
```bash
# Check current documentation status
npm run docs:check

# Review relevant documentation files
# Understand what needs to be updated
```

### **2. During Development**
- Update documentation as you implement features
- Keep docs in sync with code changes
- Add examples and screenshots when helpful

### **3. Before Committing**
```bash
# Verify documentation is updated
npm run docs:check

# Fix any warnings or errors
# Ensure all changes are documented
```

### **4. Commit and Push**
```bash
# Commit documentation changes
git add docs/
git commit -m "docs: update feature documentation for new X feature"

# Push changes
git push origin main
```

## 📝 **Documentation Standards**

### **File Structure**
Each documentation file should have:
- Clear title and description
- Table of contents (for long files)
- Consistent formatting and style
- Cross-references to related sections
- Examples and code snippets when relevant

### **Writing Style**
- **Clear and Concise**: Use simple, direct language
- **Technical Accuracy**: Ensure all technical details are correct
- **User-Focused**: Write for the intended audience
- **Consistent Terminology**: Use the same terms throughout
- **Actionable**: Provide clear next steps and examples

### **Code Examples**
```typescript
// Always use TypeScript for code examples
interface ExampleProps {
  title: string;
  description?: string;
}

const ExampleComponent: React.FC<ExampleProps> = ({ title, description }) => {
  return (
    <div className="example">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
};
```

### **Links and References**
- Use relative paths for internal links: `[Features](./FEATURES.md)`
- Use absolute URLs for external links: `[React Docs](https://react.dev/)`
- Always verify links work before committing
- Update links when files are moved or renamed

## 🔍 **Documentation Quality Checklist**

Before committing documentation changes, ensure:

- [ ] **Content is Accurate**: Matches current implementation
- [ ] **Links Work**: All internal and external links are valid
- [ ] **Formatting is Consistent**: Follows established patterns
- [ ] **Examples are Working**: Code snippets are tested
- [ ] **Cross-References are Updated**: Related sections are in sync
- [ ] **No TODO/FIXME Comments**: All items are addressed
- [ ] **Spelling and Grammar**: Content is well-written

## 🚀 **Using the Documentation Scripts**

### **Check Documentation Status**
```bash
npm run docs:check
```

This script will:
- Verify all required files exist
- Check for recent changes that need documentation
- Identify outdated documentation
- Find common issues and broken links
- Provide update checklist

### **Common Issues and Fixes**

#### **Missing Documentation Files**
```bash
# Create missing files
touch docs/MISSING_FILE.md

# Add basic structure
echo "# File Title" > docs/MISSING_FILE.md
echo "" >> docs/MISSING_FILE.md
echo "File description..." >> docs/MISSING_FILE.md
```

#### **Broken Links**
```bash
# Find broken links
npm run docs:check

# Fix links by updating file paths
# Ensure target files exist
```

#### **Outdated Content**
- Review recent code changes
- Update relevant documentation sections
- Remove references to removed features
- Update examples to match current implementation

## 📖 **Documentation File Descriptions**

### **`docs/README.md`**
- **Purpose**: Documentation system overview and navigation
- **Audience**: All users and contributors
- **Update Frequency**: When documentation structure changes

### **`docs/FEATURES.md`**
- **Purpose**: Detailed feature descriptions and user flows
- **Audience**: Users, developers, product managers
- **Update Frequency**: Every feature change or addition

### **`docs/ARCHITECTURE.md`**
- **Purpose**: Technical architecture and implementation details
- **Audience**: Developers, architects, maintainers
- **Update Frequency**: When architecture or data models change

### **`docs/UI-UX.md`**
- **Purpose**: Design system and user experience guidelines
- **Audience**: Designers, developers, UX researchers
- **Update Frequency**: When UI/UX changes or new components added

### **`docs/DEVELOPMENT.md`**
- **Purpose**: Development workflow and coding standards
- **Audience**: Developers, maintainers
- **Update Frequency**: When development process changes

### **`docs/CHANGELOG.md`**
- **Purpose**: Version history and change tracking
- **Audience**: Users, developers, stakeholders
- **Update Frequency**: Every commit (auto-generated)

### **`docs/ROADMAP.md`**
- **Purpose**: Future plans and development milestones
- **Audience**: Users, developers, stakeholders
- **Update Frequency**: When plans change or milestones reached

## 🤝 **Getting Help**

### **Documentation Issues**
- Create GitHub issues for documentation problems
- Tag issues with `documentation` label
- Provide specific details about what needs fixing

### **Questions and Suggestions**
- Use GitHub discussions for questions
- Submit feature requests for documentation improvements
- Join community conversations about documentation

### **Contributing Guidelines**
- Follow the established documentation patterns
- Use clear commit messages for documentation changes
- Test documentation locally before submitting
- Be patient with review and feedback

## 📚 **Resources and References**

### **Markdown Resources**
- [GitHub Markdown Guide](https://docs.github.com/en/github/writing-on-github)
- [Markdown Cheat Sheet](https://www.markdownguide.org/cheat-sheet/)
- [Markdown Lint Rules](https://github.com/DavidAnson/markdownlint)

### **Documentation Best Practices**
- [Write the Docs](https://www.writethedocs.org/)
- [Documentation Style Guide](https://developers.google.com/style)
- [Technical Writing](https://developers.google.com/tech-writing)

### **GenieNotes Resources**
- [Project README](../README.md)
- [Development Guide](./DEVELOPMENT.md)
- [Architecture Guide](./ARCHITECTURE.md)

---

## 🎯 **Quick Start for Contributors**

1. **Fork the repository**
2. **Check documentation status**: `npm run docs:check`
3. **Make your changes** and update relevant docs
4. **Verify documentation**: `npm run docs:check` again
5. **Commit and push** your changes
6. **Create a pull request** with clear description

**Thank you for helping keep GenieNotes documentation current and helpful!** 🎉

---

**Remember: Good documentation is as important as good code. When in doubt, document it!** 📝

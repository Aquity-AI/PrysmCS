#!/usr/bin/env python3
# Final cleanup script to remove all customWidgets references

import re

with open('src/components/prysmcs.jsx', 'r') as f:
    content = f.read()

# 1. Update OverviewPage signature (remove customWidgets prop)
content = re.sub(
    r'function OverviewPage\(\{ data, sectionVisibility = \{\}, customWidgets = \[\], brandColor: propBrandColor \}\)',
    'function OverviewPage({ data, sectionVisibility = {}, brandColor: propBrandColor })',
    content
)

# 2. Update EnrollmentPage signature
content = re.sub(
    r'function EnrollmentPage\(\{ data, sectionVisibility = \{\}, customWidgets = \[\], brandColor: propBrandColor \}\)',
    'function EnrollmentPage({ data, sectionVisibility = {}, brandColor: propBrandColor })',
    content
)

# 3. Update FinancialPage signature
content = re.sub(
    r'function FinancialPage\(\{ data, sectionVisibility = \{\}, customWidgets = \[\], brandColor: propBrandColor \}\)',
    'function FinancialPage({ data, sectionVisibility = {}, brandColor: propBrandColor })',
    content
)

# 4. Update CustomizationPage signature
content = re.sub(
    r'function CustomizationPage\(\{ customWidgets, setCustomWidgets, onNavigate \}\)',
    'function CustomizationPage({ onNavigate })',
    content
)

# 5. Remove customWidgets prop from OverviewPage calls
content = re.sub(
    r'<OverviewPage data=\{dashboardData\} sectionVisibility=\{sectionVisibility\} customWidgets=\{customWidgets\} brandColor=\{customization\.branding\.primaryColor\} />',
    '<OverviewPage data={dashboardData} sectionVisibility={sectionVisibility} brandColor={customization.branding.primaryColor} />',
    content
)

# 6. Remove customWidgets prop from EnrollmentPage calls
content = re.sub(
    r'<EnrollmentPage data=\{dashboardData\} sectionVisibility=\{sectionVisibility\} customWidgets=\{customWidgets\} brandColor=\{customization\.branding\.primaryColor\} />',
    '<EnrollmentPage data={dashboardData} sectionVisibility={sectionVisibility} brandColor={customization.branding.primaryColor} />',
    content
)

# 7. Remove customWidgets prop from FinancialPage calls
content = re.sub(
    r'<FinancialPage data=\{dashboardData\} sectionVisibility=\{sectionVisibility\} customWidgets=\{customWidgets\} brandColor=\{customization\.branding\.primaryColor\} />',
    '<FinancialPage data={dashboardData} sectionVisibility={sectionVisibility} brandColor={customization.branding.primaryColor} />',
    content
)

# 8. Remove customWidgets prop from CustomizationPage call
content = re.sub(
    r'<CustomizationPage customWidgets=\{customWidgets\} setCustomWidgets=\{setCustomWidgets\} onNavigate=\{setActivePage\} />',
    '<CustomizationPage onNavigate={setActivePage} />',
    content
)

# 9. Remove customWidgets state declaration in PrysmCS
content = re.sub(
    r'  const \[customWidgets, setCustomWidgets\] = useState\(\[\]\);\n',
    '',
    content
)

with open('src/components/prysmcs.jsx', 'w') as f:
    f.write(content)

print("Updated function signatures and removed customWidgets props")

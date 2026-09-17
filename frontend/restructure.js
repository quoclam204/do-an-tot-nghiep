import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

// 1. Define file migrations
const moves = [
  // Modals
  { from: 'pages/ActivityTypesModal.jsx', to: 'components/modals/ActivityTypesModal.jsx' },
  { from: 'pages/ActivityTypesModal.css', to: 'components/modals/ActivityTypesModal.css' },
  { from: 'components/ReceiptOcrModal.jsx', to: 'components/modals/ReceiptOcrModal.jsx' },
  { from: 'components/ReceiptOcrModal.css', to: 'components/modals/ReceiptOcrModal.css' },

  // Auth pages
  { from: 'pages/LoginPage.jsx', to: 'pages/auth/LoginPage.jsx' },
  { from: 'pages/RegisterPage.jsx', to: 'pages/auth/RegisterPage.jsx' },
  { from: 'pages/ForgotPasswordPage.jsx', to: 'pages/auth/ForgotPasswordPage.jsx' },
  { from: 'pages/ResetPasswordPage.jsx', to: 'pages/auth/ResetPasswordPage.jsx' },
  { from: 'pages/AuthPage.css', to: 'pages/auth/AuthPage.css' },

  // Farms pages
  { from: 'pages/FarmsPage.jsx', to: 'pages/farms/FarmsPage.jsx' },
  { from: 'pages/FarmsPage.css', to: 'pages/farms/FarmsPage.css' },
  { from: 'pages/FarmDetailPage.jsx', to: 'pages/farms/FarmDetailPage.jsx' },
  { from: 'pages/FarmDetailPage.css', to: 'pages/farms/FarmDetailPage.css' },
  { from: 'pages/FarmingLogPage.jsx', to: 'pages/farms/FarmingLogPage.jsx' },
  { from: 'pages/FarmingLogPage.css', to: 'pages/farms/FarmingLogPage.css' },

  // Crops & Production pages
  { from: 'pages/CropsPage.jsx', to: 'pages/crops/CropsPage.jsx' },
  { from: 'pages/CropsPage.css', to: 'pages/crops/CropsPage.css' },
  { from: 'pages/SeasonsPage.jsx', to: 'pages/crops/SeasonsPage.jsx' },
  { from: 'pages/SeasonsPage.css', to: 'pages/crops/SeasonsPage.css' },
  { from: 'pages/HarvestPage.jsx', to: 'pages/crops/HarvestPage.jsx' },
  { from: 'pages/HarvestPage.css', to: 'pages/crops/HarvestPage.css' },

  // Warehouse & Sales pages
  { from: 'pages/MaterialsPage.jsx', to: 'pages/warehouse/MaterialsPage.jsx' },
  { from: 'pages/MaterialsPage.css', to: 'pages/warehouse/MaterialsPage.css' },
  { from: 'pages/InventoryPage.jsx', to: 'pages/warehouse/InventoryPage.jsx' },
  { from: 'pages/InventoryPage.css', to: 'pages/warehouse/InventoryPage.css' },
  { from: 'pages/SalesPage.jsx', to: 'pages/warehouse/SalesPage.jsx' },
  { from: 'pages/SalesPage.css', to: 'pages/warehouse/SalesPage.css' },

  // Admin page
  { from: 'pages/AdminDashboardPage.jsx', to: 'pages/admin/AdminDashboardPage.jsx' },
  { from: 'pages/AdminDashboardPage.css', to: 'pages/admin/AdminDashboardPage.css' },

  // Reports page
  { from: 'pages/ReportsPage.jsx', to: 'pages/reports/ReportsPage.jsx' },
  { from: 'pages/ReportsPage.css', to: 'pages/reports/ReportsPage.css' },

  // Account page
  { from: 'pages/AccountPage.jsx', to: 'pages/account/AccountPage.jsx' },
  { from: 'pages/AccountPage.css', to: 'pages/account/AccountPage.css' },

  // Home page
  { from: 'pages/HomePage.jsx', to: 'pages/home/HomePage.jsx' },
  { from: 'styles/HomePage.css', to: 'pages/home/HomePage.css' },
];

console.log('🚀 Đang thực hiện di chuyển và tái cấu trúc file...');

moves.forEach(({ from, to }) => {
  const srcPath = path.join(srcDir, from);
  const destPath = path.join(srcDir, to);

  if (fs.existsSync(srcPath)) {
    const destFolder = path.dirname(destPath);
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    let content = fs.readFileSync(srcPath, 'utf8');

    // Adjust import paths for files moved 1 level deeper (into pages/*/)
    if (to.startsWith('pages/') && to.split('/').length > 2) {
      // Relative imports to services, components, context, assets
      content = content.replace(/(['"])\.\.\/services\//g, '$1../../services/');
      content = content.replace(/(['"])\.\.\/components\//g, '$1../../components/');
      content = content.replace(/(['"])\.\.\/context\//g, '$1../../context/');
      content = content.replace(/(['"])\.\.\/assets\//g, '$1../../assets/');
      content = content.replace(/(['"])\.\.\/styles\/HomePage\.css(['"])/g, '$1./HomePage.css$2');
    }

    // Specific modal path updates in FarmingLogPage.jsx
    if (from.includes('FarmingLogPage.jsx')) {
      content = content.replace(
        /(['"])\.\.\/components\/ReceiptOcrModal(['"])/g,
        '$1../../components/modals/ReceiptOcrModal$2'
      );
      content = content.replace(
        /(['"])\.\/ActivityTypesModal(['"])/g,
        '$1../../components/modals/ActivityTypesModal$2'
      );
    }

    // Specific updates in ActivityTypesModal.jsx
    if (from.includes('ActivityTypesModal.jsx')) {
      content = content.replace(/(['"])\.\.\/components\/icons(['"])/g, '$1../icons$2');
      content = content.replace(/(['"])\.\.\/services\/api(['"])/g, '$1../../services/api$2');
    }

    // Specific updates in ReceiptOcrModal.jsx
    if (from.includes('ReceiptOcrModal.jsx')) {
      content = content.replace(/(['"])\.\/icons(['"])/g, '$1../icons$2');
    }

    fs.writeFileSync(destPath, content, 'utf8');
    fs.unlinkSync(srcPath);
    console.log(`✓ Đã chuyển: ${from} -> ${to}`);
  } else {
    console.log(`- Bỏ qua (không tìm thấy): ${from}`);
  }
});

// Remove empty styles directory if empty
const stylesDir = path.join(srcDir, 'styles');
if (fs.existsSync(stylesDir) && fs.readdirSync(stylesDir).length === 0) {
  fs.rmdirSync(stylesDir);
  console.log('✓ Đã dọn dẹp thư mục styles trống');
}

console.log(' Hoàn tất tái cấu trúc thư mục!');

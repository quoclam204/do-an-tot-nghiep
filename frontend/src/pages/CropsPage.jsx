import React, { useState, useEffect, useMemo, useRef } from 'react';
import './CropsPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import {
  IconSprout,
  IconLeaf,
  IconTreePine,
  IconPlus,
  IconZap,
  IconSearch,
  IconFilter,
  IconEye,
  IconPenLine,
  IconTrash,
  IconCheckCircle,
  IconClock,
  IconCalendar,
  IconX,
  IconFlask,
  IconUpload,
  IconCamera,
  IconAlertTriangle,
  IconLayers,
  IconImage,
  IconArrowRight,
  IconArrowLeft,
} from '../components/icons';
import {
  apiGetCrops,
  apiCreateCrop,
  apiUpdateCrop,
  apiDeleteCrop,
  apiSeedLamDong,
  apiGetSeasons,
} from '../services/api';

// ==================== METADATA STORAGE HELPER ====================
const CROP_METAS_STORAGE_KEY = 'dalatagri_custom_crop_metas';

const getStoredMetas = () => {
  try {
    const raw = localStorage.getItem(CROP_METAS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveStoredMeta = (key, meta) => {
  try {
    const current = getStoredMetas();
    current[key] = meta;
    localStorage.setItem(CROP_METAS_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Không thể lưu metadata cây trồng:', e);
  }
};

// ==================== BỘ DỮ LIỆU CÂY TRỒNG MẪU CHUẨN ====================
const PRESET_CROPS = [
  {
    name: 'Cà phê Robusta cao sản',
    type: 'Cây công nghiệp lâu năm',
    badge: 'Cây xuất khẩu chủ lực',
    category: 'CONG_NGHIEP',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    density: '1.100 cây/ha (cự ly 3m x 3m)',
    harvestDuration: '8 - 9 tháng sau nở hoa',
    harvestUnit: 'Tạ nhân khô / Kg quả tươi',
    commonPests: 'Nấm gỉ sắt, rệp sáp gốc, mọt đục cành, tuyến trùng rễ',
    description: 'Giống cà phê vối sinh trưởng khỏe, năng suất 3.5 - 4.5 tấn nhân/ha, thích nghi rộng các vùng đất đỏ bazan và đồi núi.',
    stages: [
      { name: 'Phục hồi sau thu hoạch & Tỉa cành', durationDays: 30, desc: 'Cắt cành tăm, cành sâu bệnh, bón phân hữu cơ vi sinh, dọn vườn.' },
      { name: 'Phân hóa mầm hoa & Nở hoa rộ', durationDays: 25, desc: 'Tưới đẫm nước đợt 1 để hoa bung đều đồng loạt, đậu trái cao.' },
      { name: 'Nuôi trái non & Phát triển cành dự trữ', durationDays: 120, desc: 'Bón NPK 16-16-8, phun phòng mọt đục cành, rệp sáp.' },
      { name: 'Nuôi hạt chắc & Chín tập trung', durationDays: 75, desc: 'Bón NPK giàu Kali (15-5-20), hạn chế rụng quả sinh lý.' },
      { name: 'Thu hoạch quả chín (>85%)', durationDays: 45, desc: 'Hái chọn lọc quả chín, phơi sấy đúng kỹ thuật giữ phẩm chất.' },
    ],
    recommendedMaterials: ['NPK 20-20-15 Đầu Trâu', 'Phân Hữu Cơ Vi Sinh', 'Regent 800WG', 'Vôi nông nghiệp'],
  },
  {
    name: 'Sầu riêng Ri6 cơm vàng hạt lép',
    type: 'Cây ăn trái đặc sản',
    badge: 'Giá trị kinh tế cao',
    category: 'AN_TRAI',
    image: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=800&q=80',
    density: '120 - 150 cây/ha (cự ly 8m x 8m)',
    harvestDuration: '100 - 115 ngày từ khi xả nhụy',
    harvestUnit: 'Kg quả tươi (trái)',
    commonPests: 'Bệnh xì mủ thân (Phytophthora), rầy nhảy hại đọt, sâu đục trái',
    description: 'Giống sầu riêng cơm vàng, hạt lép, ngọt béo; cực kỳ nhạy cảm với phân Clo (bắt buộc dùng Kali trắng Sulphate chống sượng cơm).',
    stages: [
      { name: 'Xử lý ra hoa & Kéo đọt đồng loạt', durationDays: 45, desc: 'Tạo khô hạn siết nước, phun tạo mầm hoa, bổ sung Bo-Canxi.' },
      { name: 'Xổ nhụy & Đậu trái non', durationDays: 20, desc: 'Thụ phấn bổ sung ban đêm, giữ ẩm đất nhẹ, tuyệt đối không bón đạm cao.' },
      { name: 'Nuôi trái & Tỉa định hình', durationDays: 85, desc: 'Tỉa chỉ giữ 60 - 80 trái/cây, bón Kali trắng ngừa sượng cơm, quét Ridomil ngừa nấm xì mủ.' },
      { name: 'Cắt trái thu hoạch', durationDays: 30, desc: 'Thu hoạch khi đạt 8.5 - 9 tuổi (gõ nghe bồm bộp, mùi thơm nhẹ).' },
      { name: 'Phục hồi cây sau mùa vụ', durationDays: 40, desc: 'Tỉa cành, rửa vườn với thuốc gốc đồng, bón phục hồi bộ rễ.' },
    ],
    recommendedMaterials: ['Ridomil Gold 68WG', 'Bo - Canxi vi lượng', 'Phân Hữu cơ Bỉ', 'NPK 12-12-17 Kali Trắng'],
  },
  {
    name: 'Mắc ca ghép giống OC / QN1',
    type: 'Cây lấy hạt giá trị cao',
    badge: 'Nông nghiệp bền vững',
    category: 'HAT',
    image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80',
    density: '350 - 400 cây/ha (cự ly 6m x 4m)',
    harvestDuration: '7 - 8 tháng tích lũy tinh dầu',
    harvestUnit: 'Kg hạt tươi bóc vỏ / Hạt sấy nứt',
    commonPests: 'Bọ xít muỗi chích chùm hoa, nấm thối hoa, sâu đục vỏ quả',
    description: 'Cây lấy hạt dinh dưỡng giá trị cao, chịu hạn tốt, phù hợp trồng thuần hoặc xen canh vườn cà phê tăng thu nhập kép.',
    stages: [
      { name: 'Phân hóa mầm hoa & Nở hoa chuỗi', durationDays: 35, desc: 'Tưới nước định kỳ, phòng ngừa bọ xít muỗi chích hút chùm hoa.' },
      { name: 'Đậu quả non & Phát triển vỏ', durationDays: 90, desc: 'Bón phân NPK cân đối, giữ ẩm gốc chống rụng quả non.' },
      { name: 'Tích lũy tinh dầu & Hóa gỗ hạt', durationDays: 70, desc: 'Nhân hạt tích lũy hàm lượng dầu béo tự nhiên cao nhất.' },
      { name: 'Thu hoạch quả rụng tự nhiên', durationDays: 40, desc: 'Thu nhặt quả rụng, bóc vỏ xanh trong vòng 24h để tránh nấm mốc.' },
    ],
    recommendedMaterials: ['Phân trùn quế hữu cơ', 'NPK 15-15-15', 'Thuốc trừ bọ xít sinh học'],
  },
  {
    name: 'Bơ sáp 034 cơm vàng',
    type: 'Cây ăn trái đặc sản',
    badge: 'Trái cây năng suất cao',
    category: 'AN_TRAI',
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80',
    density: '200 - 250 cây/ha (cự ly 6m x 7m)',
    harvestDuration: '5.5 - 6 tháng nuôi quả',
    harvestUnit: 'Kg quả tươi',
    commonPests: 'Bọ xít muỗi, bọ trĩ hại quả non, nấm thán thư cuống',
    description: 'Giống bơ trái dài 25 - 35cm, cơm vàng dẻo béo ngậy, cho thu hoạch quả 2 vụ/năm, giá trị thương phẩm cao.',
    stages: [
      { name: 'Đón hoa & Nuôi hoa', durationDays: 30, desc: 'Xiết nước nhẹ kích hoa bung đều, phun dưỡng hoa Bo-Kẽm.' },
      { name: 'Đậu trái & Tỉa quả chùm', durationDays: 35, desc: 'Tỉa bớt quả cong teo, giữ quả thẳng đẹp đều.' },
      { name: 'Nuôi trái lớn & Tăng độ dẻo béo', durationDays: 90, desc: 'Tưới nước đều đặn, bón phân hữu cơ khoáng vi lượng.' },
      { name: 'Thu hoạch quả đạt chuẩn', durationDays: 30, desc: 'Hái nhẹ tay khi quả già bóng láng, giữ cuống tươi.' },
    ],
    recommendedMaterials: ['Phân cá vi sinh', 'Bo - Canxi Amino', 'NPK hữu cơ sinh học'],
  },
  {
    name: 'Chè Ô Long búp xanh',
    type: 'Cây công nghiệp lâu năm',
    badge: 'Đặc sản giá trị cao',
    category: 'CONG_NGHIEP',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    density: '15.000 - 18.000 bụi/ha',
    harvestDuration: '40 - 45 ngày / lứa hái búp',
    harvestUnit: 'Kg búp tươi (1 tôm 2 lá)',
    commonPests: 'Rầy xanh, bọ cánh tơ, nhện đỏ',
    description: 'Giống chè búp xanh mập mạp, chu kỳ hái gối vụ quanh năm, đòi hỏi nguồn nước tưới sạch và phân bón hữu cơ sinh học.',
    stages: [
      { name: 'Đốn tỉa tạo tán & Làm cỏ', durationDays: 20, desc: 'Đốn phớt tạo mặt bằng tán phẳng, bón lót phân chuồng hoai.' },
      { name: 'Kích búp & Nuôi chồi non', durationDays: 30, desc: 'Bón thúc đạm hữu cơ sinh học, tưới phun sương giữ ẩm.' },
      { name: 'Hái búp 1 tôm 2 lá', durationDays: 15, desc: 'Thu hái vào buổi sáng khi ráo sương, đưa vào chế biến trong ngày.' },
    ],
    recommendedMaterials: ['Phân hữu cơ khoáng', 'Chế phẩm sinh học thảo mộc', 'NPK chuyên dùng chè'],
  },
  {
    name: 'Hồ tiêu Vĩnh Linh',
    type: 'Cây công nghiệp lâu năm',
    badge: 'Gia vị xuất khẩu',
    category: 'CONG_NGHIEP',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80',
    density: '1.600 - 1.800 trụ/ha (cự ly 2.5m x 2.2m)',
    harvestDuration: '9 - 10 tháng',
    harvestUnit: 'Tạ tiêu đen / Tạ tiêu sọ',
    commonPests: 'Bệnh chết nhanh (Phytophthora), bệnh chết chậm (tuyến trùng), rệp sáp',
    description: 'Giống tiêu hạt to cay nồng, rễ nhạy cảm úng nước, cần hệ thống rãnh thoát nước sâu và phòng ngừa nấm đối kháng định kỳ.',
    stages: [
      { name: 'Xử lý ra hoa đồng loạt', durationDays: 30, desc: 'Hãm nước đầu mùa mưa, phun kích ra gié hoa.' },
      { name: 'Đậu hạt & Nuôi chuỗi gié', durationDays: 120, desc: 'Bón phân NPK cân đối, phun phòng rệp sáp gié tiêu.' },
      { name: 'Chắc hạt & Chín đỏ', durationDays: 60, desc: 'Bón tăng cường Kali, hạn chế tưới nước khi hạt vào chắc.' },
      { name: 'Thu hoạch chuỗi quả chín', durationDays: 40, desc: 'Thu hái chùm chín rộ, phơi sấy trên bạt sạch.' },
    ],
    recommendedMaterials: ['Trichoderma đối kháng', 'Phân hữu cơ nở', 'NPK 16-8-16 Đầu Trâu'],
  },
];

// Mẫu ảnh chất lượng cao để chọn nhanh
const QUICK_SAMPLE_IMAGES = [
  { label: 'Cà phê', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sầu riêng', url: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Mắc ca', url: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80' },
  { label: 'Bơ sáp', url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80' },
  { label: 'Chè / Trà', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80' },
  { label: 'Hồ tiêu', url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80' },
  { label: 'Bưởi / Cam', url: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=800&q=80' },
];

export default function CropsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [crops, setCrops] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal / Drawer state
  const [selectedCropDetail, setSelectedCropDetail] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [formActiveTab, setFormActiveTab] = useState('INFO'); // 'INFO' | 'SPECS' | 'STAGES'

  // Form Data đầy đủ các thông số nông nghiệp chuyên sâu
  const [formData, setFormData] = useState({
    name: '',
    type: 'Cây công nghiệp lâu năm',
    image: '',
    density: '',
    harvestDuration: '',
    harvestUnit: 'Kg quả tươi',
    commonPests: '',
    recommendedMaterials: '',
    description: '',
    stages: [
      { name: 'Phục hồi sau thu hoạch & Tỉa cành', durationDays: 30, desc: 'Tỉa cành vô hiệu, bón phân hữu cơ vi sinh, dọn vườn sạch sẽ.' },
      { name: 'Phân hóa mầm hoa & Bung hoa', durationDays: 30, desc: 'Tưới đẫm nước, phun dưỡng hoa Bo-Canxi.' },
      { name: 'Nuôi trái non & Phát triển', durationDays: 90, desc: 'Bón NPK cân đối, kiểm tra phòng trừ sâu bệnh định kỳ.' },
      { name: 'Thu hoạch chính vụ', durationDays: 30, desc: 'Hái chọn lọc quả chín đạt tiêu chuẩn thương phẩm cao.' },
    ],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tải dữ liệu
  const loadData = async () => {
    try {
      setLoading(true);
      const [cropsData, seasonsData] = await Promise.all([
        apiGetCrops().catch(() => []),
        apiGetSeasons().catch(() => []),
      ]);
      setCrops(cropsData || []);
      setSeasons(seasonsData || []);
    } catch (err) {
      console.error('Lỗi khi tải cây trồng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lấy icon chuẩn SVG theo loại cây
  const renderCropCategoryIcon = (type = '', name = '', size = 24) => {
    const text = (type + ' ' + name).toLowerCase();
    if (text.includes('công nghiệp') || text.includes('cà phê') || text.includes('chè') || text.includes('tiêu')) {
      return <IconTreePine size={size} strokeWidth={2} />;
    }
    if (text.includes('ăn trái') || text.includes('sầu riêng') || text.includes('bơ') || text.includes('bưởi') || text.includes('mít')) {
      return <IconSprout size={size} strokeWidth={2} />;
    }
    if (text.includes('hạt') || text.includes('mắc ca') || text.includes('điều')) {
      return <IconLeaf size={size} strokeWidth={2} />;
    }
    return <IconSprout size={size} strokeWidth={2} />;
  };

  // Lấy ảnh và thông tin chi tiết kỹ thuật cho từng cây
  const getCropMeta = (crop) => {
    const stored = getStoredMetas();
    const customMeta = stored[crop.id] || stored[crop.name];
    if (customMeta) {
      return {
        ...customMeta,
        name: crop.name,
        type: crop.type || customMeta.type || 'Cây dài ngày',
      };
    }

    const matched = PRESET_CROPS.find(
      (p) =>
        p.name.toLowerCase().includes(crop.name.toLowerCase()) ||
        crop.name.toLowerCase().includes(p.name.split(' ')[0].toLowerCase())
    );
    if (matched) return matched;

    return {
      name: crop.name,
      type: crop.type || 'Cây dài ngày',
      badge: 'Cây trồng nông hộ',
      image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=800&q=80',
      density: 'Theo quy chuẩn nông hộ',
      harvestDuration: 'Theo chu kỳ mùa vụ',
      harvestUnit: 'Kg nông sản',
      commonPests: 'Kiểm tra sâu bọ & bệnh lá định kỳ',
      description: `Giống ${crop.name} được theo dõi và ghi chép canh tác tại nông trại.`,
      stages: [
        { name: 'Thời kỳ sinh trưởng & Nuôi cây', durationDays: 60, desc: 'Chăm sóc dinh dưỡng và phòng trừ sâu bệnh định kỳ.' },
        { name: 'Thời kỳ thu hoạch', durationDays: 30, desc: 'Thu hoạch sản lượng nông sản đạt tiêu chuẩn chất lượng.' },
      ],
      recommendedMaterials: ['Phân Hữu Cơ Vi Sinh', 'NPK Đầu Trâu'],
    };
  };

  // Tính số mùa vụ đang áp dụng cho từng cây
  const getActiveSeasonsCount = (cropId) => {
    return seasons.filter((s) => s.cropId === cropId && s.status === 'DANG_CANH_TAC').length;
  };

  // Danh sách cây sau khi lọc
  const filteredCrops = useMemo(() => {
    return crops.filter((crop) => {
      const matchSearch =
        crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (crop.type && crop.type.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (selectedCategory === 'ALL') return true;
      if (selectedCategory === 'CONG_NGHIEP') {
        return (crop.type && crop.type.includes('công nghiệp')) || crop.name.includes('Cà phê') || crop.name.includes('Chè') || crop.name.includes('tiêu');
      }
      if (selectedCategory === 'AN_TRAI') {
        return (crop.type && crop.type.includes('ăn trái')) || crop.name.includes('Sầu riêng') || crop.name.includes('Bơ') || crop.name.includes('Bưởi');
      }
      if (selectedCategory === 'HAT') {
        return (crop.type && crop.type.includes('hạt')) || crop.name.includes('Mắc ca') || crop.name.includes('Điều');
      }
      return true;
    });
  }, [crops, searchTerm, selectedCategory]);

  // Seed mẫu dữ liệu cây trồng
  const handleSeed = async () => {
    if (!window.confirm('Hệ thống sẽ tự động khởi tạo dữ liệu mẫu cây trồng và vật tư phổ biến toàn quốc (Cà phê, Sầu riêng, Mắc ca, Bơ...). Bạn có muốn tiếp tục?')) return;
    try {
      setSeeding(true);
      await apiSeedLamDong();
      await loadData();
      alert('Đã khởi tạo thành công danh mục Cây trồng & Chu kỳ sinh trưởng mẫu!');
    } catch (err) {
      alert('Không thể nạp dữ liệu mẫu: ' + (err.response?.data?.message || err.message));
    } finally {
      setSeeding(false);
    }
  };

  // Mở modal thêm/sửa
  const handleOpenForm = (crop = null) => {
    if (crop) {
      setEditingCrop(crop);
      const meta = getCropMeta(crop);
      setFormData({
        name: crop.name,
        type: crop.type || 'Cây công nghiệp lâu năm',
        image: meta.image || '',
        density: meta.density || '',
        harvestDuration: meta.harvestDuration || '',
        harvestUnit: meta.harvestUnit || 'Kg quả tươi',
        commonPests: meta.commonPests || '',
        recommendedMaterials: Array.isArray(meta.recommendedMaterials) ? meta.recommendedMaterials.join(', ') : (meta.recommendedMaterials || ''),
        description: meta.description || '',
        stages: meta.stages && meta.stages.length > 0 ? meta.stages : [
          { name: 'Nuôi dưỡng & Chăm sóc', durationDays: 60, desc: 'Bón phân, tỉa cành, tưới nước.' },
          { name: 'Thu hoạch mùa vụ', durationDays: 30, desc: 'Thu hoạch sản phẩm đạt chuẩn.' },
        ],
      });
    } else {
      setEditingCrop(null);
      setFormData({
        name: '',
        type: 'Cây công nghiệp lâu năm',
        image: '',
        density: '',
        harvestDuration: '',
        harvestUnit: 'Kg quả tươi',
        commonPests: '',
        recommendedMaterials: '',
        description: '',
        stages: [
          { name: 'Phục hồi sau thu hoạch & Tỉa cành', durationDays: 30, desc: 'Tỉa cành vô hiệu, bón phân hữu cơ vi sinh, dọn vườn sạch sẽ.' },
          { name: 'Phân hóa mầm hoa & Bung hoa', durationDays: 30, desc: 'Tưới đẫm nước, phun dưỡng hoa Bo-Canxi.' },
          { name: 'Nuôi trái non & Phát triển', durationDays: 90, desc: 'Bón NPK cân đối, kiểm tra phòng trừ sâu bệnh định kỳ.' },
          { name: 'Thu hoạch chính vụ', durationDays: 30, desc: 'Hái chọn lọc quả chín đạt tiêu chuẩn thương phẩm cao.' },
        ],
      });
    }
    setFormActiveTab('INFO');
    setIsFormOpen(true);
  };

  // Áp dụng mẫu từ preset vào form thêm mới
  const handleSelectPreset = (preset) => {
    setFormData({
      name: preset.name,
      type: preset.type,
      image: preset.image || '',
      density: preset.density || '',
      harvestDuration: preset.harvestDuration || '',
      harvestUnit: preset.harvestUnit || 'Kg quả tươi',
      commonPests: preset.commonPests || '',
      recommendedMaterials: Array.isArray(preset.recommendedMaterials) ? preset.recommendedMaterials.join(', ') : '',
      description: preset.description || '',
      stages: preset.stages || [
        { name: 'Phục hồi sau thu hoạch', durationDays: 30, desc: 'Tỉa cành, bón phân hữu cơ.' },
        { name: 'Thu hoạch chính vụ', durationDays: 30, desc: 'Thu hoạch quả đạt chuẩn.' },
      ],
    });
  };

  // Xử lý upload ảnh bằng FileReader (hỗ trợ JPG, PNG, WEBP)
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 5MB!');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Xóa ảnh đã chọn
  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Stage builder helpers
  const handleAddStage = () => {
    setFormData((prev) => ({
      ...prev,
      stages: [
        ...prev.stages,
        { name: '', durationDays: 30, desc: '' },
      ],
    }));
  };

  const handleUpdateStage = (index, field, value) => {
    setFormData((prev) => {
      const next = [...prev.stages];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, stages: next };
    });
  };

  const handleRemoveStage = (index) => {
    if (formData.stages.length <= 1) {
      alert('Quy trình sinh trưởng cần có ít nhất 1 giai đoạn!');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.filter((_, idx) => idx !== index),
    }));
  };

  // Submit form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Vui lòng nhập tên cây trồng!');

    try {
      setIsSubmitting(true);
      let savedCrop;
      if (editingCrop) {
        savedCrop = await apiUpdateCrop(editingCrop.id, {
          name: formData.name.trim(),
          type: formData.type,
        });
      } else {
        savedCrop = await apiCreateCrop({
          name: formData.name.trim(),
          type: formData.type,
        });
      }

      // Metadata chuyên sâu (Ảnh, Mật độ, Sâu bệnh, Đơn vị, Quy trình sinh trưởng)
      const metaToSave = {
        name: formData.name.trim(),
        type: formData.type,
        image: formData.image || 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=800&q=80',
        badge: 'Cây trồng nông hộ',
        density: formData.density.trim() || 'Theo quy cách vườn',
        harvestDuration: formData.harvestDuration.trim() || 'Theo chu kỳ mùa vụ',
        harvestUnit: formData.harvestUnit.trim() || 'Kg',
        commonPests: formData.commonPests.trim() || 'Theo dõi sâu bệnh lá định kỳ',
        description: formData.description.trim() || `Giống ${formData.name.trim()} được quản lý và theo dõi canh tác.`,
        recommendedMaterials: formData.recommendedMaterials
          ? formData.recommendedMaterials.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Phân hữu cơ vi sinh', 'NPK Đầu Trâu'],
        stages: formData.stages && formData.stages.length > 0 ? formData.stages : [
          { name: 'Thời kỳ chăm sóc', durationDays: 60, desc: 'Bón phân, chăm sóc' },
          { name: 'Thời kỳ thu hoạch', durationDays: 30, desc: 'Thu hoạch sản phẩm' },
        ],
      };

      const keyId = (savedCrop && savedCrop.id) || (editingCrop && editingCrop.id) || formData.name.trim();
      saveStoredMeta(keyId, metaToSave);
      saveStoredMeta(formData.name.trim(), metaToSave);

      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      alert('Lỗi lưu cây trồng: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa cây trồng
  const handleDeleteCrop = async (crop) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cây trồng "${crop.name}"?`)) return;
    try {
      await apiDeleteCrop(crop.id);
      await loadData();
    } catch (err) {
      alert('Không thể xóa: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="crops-page-container">
      <Header />

      <main className="crops-main-content container">
        {/* ================= HERO & HEADER BANNER ================= */}
        <section className="crops-hero-banner">
          <div className="crops-hero-text">
            <div className="crops-pill-tag">
              <IconLeaf size={15} strokeWidth={2.2} />
              <span>ỨNG DỤNG QUẢN LÝ NÔNG NGHIỆP THÔNG MINH</span>
            </div>
            <h1>Quản Lý Cây Trồng & Chu Kỳ Sinh Trưởng</h1>
            <p className="crops-hero-desc">
              Số hóa quy trình phát triển, đặc tính canh tác (mật độ, sâu bệnh, thu hoạch) và theo dõi từng giai đoạn sinh trưởng của từng loại cây trồng
              (Cà phê, Sầu riêng, Mắc ca, Bơ, Hồ tiêu, Cây ăn trái...) phục vụ cho nông hộ ở mọi vùng miền.
            </p>

            <div className="crops-quick-stats">
              <div className="stat-card">
                <div className="stat-icon-wrap icon-green">
                  <IconSprout size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="stat-value">{crops.length}</div>
                  <div className="stat-label">Giống cây trồng</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-gold">
                  <IconCalendar size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="stat-value">{seasons.length}</div>
                  <div className="stat-label">Mùa vụ đang áp dụng</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-blue">
                  <IconLayers size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="stat-value">Đa dạng</div>
                  <div className="stat-label">Đặc thù theo vùng miền</div>
                </div>
              </div>
            </div>
          </div>

          <div className="crops-hero-actions-box">
            <button className="crops-btn-primary" onClick={() => handleOpenForm()}>
              <IconPlus size={18} strokeWidth={2.4} />
              <span>Thêm Cây Trồng Mới</span>
            </button>
          </div>
        </section>

        {/* ================= THANH TÌM KIẾM & BỘ LỌC ================= */}
        <section className="crops-controls-bar">
          <div className="crops-search-box">
            <IconSearch size={18} strokeWidth={2.2} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm giống cây trồng theo tên hoặc nhóm phân loại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
                <IconX size={16} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="crops-filter-pills">
            <button
              className={`filter-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('ALL')}
            >
              <IconFilter size={15} strokeWidth={2.2} />
              <span>Tất cả ({crops.length})</span>
            </button>
            <button
              className={`filter-pill ${selectedCategory === 'CONG_NGHIEP' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('CONG_NGHIEP')}
            >
              <IconTreePine size={15} strokeWidth={2} />
              <span>Cây công nghiệp</span>
            </button>
            <button
              className={`filter-pill ${selectedCategory === 'AN_TRAI' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('AN_TRAI')}
            >
              <IconSprout size={15} strokeWidth={2} />
              <span>Cây ăn trái</span>
            </button>
            <button
              className={`filter-pill ${selectedCategory === 'HAT' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('HAT')}
            >
              <IconLeaf size={15} strokeWidth={2} />
              <span>Cây lấy hạt</span>
            </button>
          </div>
        </section>

        {/* ================= DANH SÁCH THẺ CÂY TRỒNG ================= */}
        {loading ? (
          <div className="crops-loading-state">
            <div className="crops-spinner" />
            <p>Đang tải danh mục cây trồng & chu kỳ sinh trưởng...</p>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="crops-empty-state">
            <div className="empty-icon-wrap">
              <IconSprout size={48} strokeWidth={1.8} />
            </div>
            <h3>Chưa có cây trồng nào</h3>
            <p>Danh mục cây trồng đang trống. Hãy thêm các giống cây bạn đang canh tác thực tế tại nông trại để quản lý chu kỳ và mùa vụ.</p>
            <div className="empty-actions">
              <button className="crops-btn-primary" onClick={() => handleOpenForm()}>
                <IconPlus size={18} strokeWidth={2.4} />
                <span>Thêm Cây Trồng Đầu Tiên</span>
              </button>
            </div>
          </div>
        ) : (
          <section className="crops-cards-grid">
            {filteredCrops.map((crop) => {
              const meta = getCropMeta(crop);
              const activeCount = getActiveSeasonsCount(crop.id);
              const stagesCount = meta.stages ? meta.stages.length : 0;

              return (
                <div key={crop.id} className="crop-card-item">
                  <div className="crop-card-image-wrap">
                    <img src={meta.image} alt={crop.name} className="crop-card-img" />
                    <span className="crop-card-badge">
                      <IconCheckCircle size={13} strokeWidth={2.4} />
                      <span>{meta.badge || 'Cây trồng nông hộ'}</span>
                    </span>
                    <span className="crop-type-chip">{crop.type || 'Cây dài ngày'}</span>
                  </div>

                  <div className="crop-card-content">
                    <div className="crop-title-row">
                      <div className="crop-icon-box">
                        {renderCropCategoryIcon(crop.type, crop.name, 20)}
                      </div>
                      <div className="crop-title-text">
                        <h3 className="crop-name">{crop.name}</h3>
                        <span className="crop-type-sub">{crop.type || 'Cây dài ngày'}</span>
                      </div>
                    </div>

                    <p className="crop-desc">{meta.description}</p>

                    {/* Hàng thông số kỹ thuật gọn nhẹ */}
                    <div className="crop-specs-compact">
                      <div className="spec-compact-item" title="Mật độ canh tác">
                        <IconTreePine size={13} strokeWidth={2} />
                        <span>{meta.density ? meta.density.split('(')[0].trim() : 'Mật độ chuẩn'}</span>
                      </div>
                      <div className="spec-compact-item" title="Thời gian thu hoạch">
                        <IconClock size={13} strokeWidth={2} />
                        <span>{meta.harvestDuration || 'Theo vụ'}</span>
                      </div>
                    </div>

                    {/* Huy hiệu tóm tắt nhanh quy trình & sâu bệnh */}
                    <div className="crop-tags-compact-row">
                      <span className="compact-stage-tag" title="Số giai đoạn sinh trưởng">
                        <IconClock size={12} strokeWidth={2.2} />
                        <span>{stagesCount} giai đoạn</span>
                      </span>
                      {meta.commonPests && (
                        <span className="compact-pest-tag" title={`Sâu bệnh: ${meta.commonPests}`}>
                          <IconAlertTriangle size={12} strokeWidth={2.2} />
                          <span>Lưu ý sâu bệnh</span>
                        </span>
                      )}
                    </div>

                    {/* Thông tin mùa vụ */}
                    <div className="crop-meta-footer">
                      <div className="crop-seasons-badge">
                        <IconCalendar size={15} strokeWidth={2} />
                        <span>Đang trồng: <strong>{activeCount} vụ</strong></span>
                      </div>

                      <div className="crop-card-actions">
                        <button
                          className="action-btn detail-btn"
                          onClick={() => setSelectedCropDetail({ ...crop, meta })}
                          title="Xem chi tiết kỹ thuật & chu kỳ sinh trưởng"
                        >
                          <IconEye size={15} strokeWidth={2.2} />
                          <span>Chi tiết</span>
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleOpenForm(crop)}
                          title="Chỉnh sửa thông tin giống cây"
                        >
                          <IconPenLine size={15} strokeWidth={2.2} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteCrop(crop)}
                          title="Xóa giống cây này"
                        >
                          <IconTrash size={15} strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ================= MODAL: THÊM / SỬA CÂY TRỒNG & UPLOAD ẢNH & THÔNG SỐ ================= */}
        {isFormOpen && (
          <div className="crop-modal-backdrop" onClick={() => setIsFormOpen(false)}>
            <div className="crop-modal-dialog enhanced-crop-modal" onClick={(e) => e.stopPropagation()}>
              <div className="crop-modal-header">
                <div className="modal-title-with-icon">
                  <div className="modal-icon-badge">
                    <IconSprout size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3>{editingCrop ? 'Chỉnh Sửa Cây Trồng' : 'Thêm Cây Trồng Mới'}</h3>
                    <p className="modal-subtitle">
                      Khai báo hình ảnh, đặc tính canh tác và các giai đoạn sinh trưởng riêng cho cây
                    </p>
                  </div>
                </div>
                <button className="crop-modal-close" onClick={() => setIsFormOpen(false)}>
                  <IconX size={18} strokeWidth={2.2} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="crop-modal-form">
                {/* --- THANH ĐIỀU HƯỚNG TABS --- */}
                <div className="crop-modal-tabs">
                  <button
                    type="button"
                    className={`modal-tab-btn ${formActiveTab === 'INFO' ? 'active' : ''}`}
                    onClick={() => setFormActiveTab('INFO')}
                  >
                    <IconCamera size={15} strokeWidth={2.2} />
                    <span>1. Thông Tin & Ảnh</span>
                  </button>
                  <button
                    type="button"
                    className={`modal-tab-btn ${formActiveTab === 'SPECS' ? 'active' : ''}`}
                    onClick={() => setFormActiveTab('SPECS')}
                  >
                    <IconLayers size={15} strokeWidth={2.2} />
                    <span>2. Thông Số Canh Tác</span>
                  </button>
                  <button
                    type="button"
                    className={`modal-tab-btn ${formActiveTab === 'STAGES' ? 'active' : ''}`}
                    onClick={() => setFormActiveTab('STAGES')}
                  >
                    <IconClock size={15} strokeWidth={2.2} />
                    <span>3. Quy Trình ({formData.stages.length})</span>
                  </button>
                </div>

                {/* --- TAB 1: THÔNG TIN & ẢNH --- */}
                {formActiveTab === 'INFO' && (
                  <div className="tab-pane-content">
                    {!editingCrop && (
                      <div className="crop-preset-picker">
                        <label className="picker-label">
                          <IconZap size={14} strokeWidth={2} />
                          <span>Gợi ý nhanh giống cây trồng phổ biến (1 chạm tự điền thông số & ảnh):</span>
                        </label>
                        <div className="picker-chips-grid">
                          {PRESET_CROPS.map((p, idx) => (
                            <button
                              type="button"
                              key={idx}
                              className="preset-chip"
                              onClick={() => handleSelectPreset(p)}
                            >
                              <span className="preset-chip-icon">
                                {renderCropCategoryIcon(p.type, p.name, 18)}
                              </span>
                              <div>
                                <strong>{p.name}</strong>
                                <small>{p.type}</small>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="crop-form-section">
                      <div className="form-group">
                        <label>Tên cây trồng / Giống cây <span className="text-red">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="VD: Cà phê Robusta cao sản, Sầu riêng Ri6, Mít Thái ruột đỏ..."
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="crop-input"
                        />
                      </div>

                      <div className="form-group">
                        <label>Nhóm phân loại <span className="text-red">*</span></label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="crop-select"
                        >
                          <option value="Cây công nghiệp lâu năm">Cây công nghiệp lâu năm (Cà phê, Chè, Hồ tiêu, Điều...)</option>
                          <option value="Cây ăn trái đặc sản">Cây ăn trái đặc sản (Sầu riêng, Bơ, Bưởi, Nhãn, Vải, Mít...)</option>
                          <option value="Cây lấy hạt giá trị cao">Cây lấy hạt giá trị cao (Mắc ca, Điều, Ca cao...)</option>
                          <option value="Cây hoa & rau màu">Cây hoa, rau củ & nông sản khác</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Mô tả đặc tính giống cây</label>
                        <textarea
                          rows={2}
                          placeholder="VD: Giống cây sinh trưởng khỏe, cơm vàng hạt lép, thích hợp đất đỏ bazan..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="crop-textarea"
                        />
                      </div>
                    </div>

                    <div className="crop-form-section" style={{ borderBottom: 'none', marginBottom: 0 }}>
                      <h4 className="section-subtitle">
                        <IconCamera size={16} strokeWidth={2.2} />
                        <span>Hình Ảnh Đại Diện Cây Trồng</span>
                      </h4>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageFileChange}
                        style={{ display: 'none' }}
                      />

                      {formData.image ? (
                        <div className="crop-image-preview-card">
                          <img src={formData.image} alt="Preview cây trồng" className="preview-img" />
                          <div className="preview-overlay">
                            <button
                              type="button"
                              className="btn-change-image"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <IconUpload size={14} strokeWidth={2.2} />
                              <span>Đổi ảnh khác</span>
                            </button>
                            <button
                              type="button"
                              className="btn-remove-image"
                              onClick={handleRemoveImage}
                            >
                              <IconTrash size={14} strokeWidth={2.2} />
                              <span>Xóa ảnh</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="crop-image-dropzone"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="dropzone-icon">
                            <IconUpload size={28} strokeWidth={2} />
                          </div>
                          <p className="dropzone-title">Bấm để tải ảnh cây trồng từ máy tính / điện thoại</p>
                          <p className="dropzone-hint">Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 5MB)</p>
                        </div>
                      )}

                      <div className="quick-sample-photos-row">
                        <span className="sample-label">Hoặc chọn nhanh ảnh mẫu:</span>
                        <div className="sample-tags-list">
                          {QUICK_SAMPLE_IMAGES.map((sample, idx) => (
                            <button
                              type="button"
                              key={idx}
                              className="sample-tag-btn"
                              onClick={() => setFormData({ ...formData, image: sample.url })}
                            >
                              <IconImage size={12} strokeWidth={2} />
                              <span>{sample.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB 2: THÔNG SỐ CANH TÁC --- */}
                {formActiveTab === 'SPECS' && (
                  <div className="tab-pane-content">
                    <div className="crop-form-section" style={{ borderBottom: 'none' }}>
                      <div className="form-grid-3">
                        <div className="form-group">
                          <label>Mật độ trồng khuyến nghị</label>
                          <input
                            type="text"
                            placeholder="VD: 150 cây/ha (8m x 8m)"
                            value={formData.density}
                            onChange={(e) => setFormData({ ...formData, density: e.target.value })}
                            className="crop-input"
                          />
                        </div>

                        <div className="form-group">
                          <label>Thời gian nuôi quả đến thu hoạch</label>
                          <input
                            type="text"
                            placeholder="VD: 120 ngày hoặc 8-9 tháng"
                            value={formData.harvestDuration}
                            onChange={(e) => setFormData({ ...formData, harvestDuration: e.target.value })}
                            className="crop-input"
                          />
                        </div>

                        <div className="form-group">
                          <label>Đơn vị tính thu hoạch</label>
                          <input
                            type="text"
                            placeholder="VD: Kg quả tươi, Tạ nhân khô, Tấn"
                            value={formData.harvestUnit}
                            onChange={(e) => setFormData({ ...formData, harvestUnit: e.target.value })}
                            className="crop-input"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>
                          <span className="label-with-icon">
                            <IconAlertTriangle size={14} strokeWidth={2} className="text-amber" />
                            <span>Sâu bệnh hại nguy hiểm & Lưu ý kiểm tra</span>
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Nấm xì mủ Phytophthora, rầy nhảy hại đọt, sâu đục trái..."
                          value={formData.commonPests}
                          onChange={(e) => setFormData({ ...formData, commonPests: e.target.value })}
                          className="crop-input"
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          <span className="label-with-icon">
                            <IconFlask size={14} strokeWidth={2} className="text-green" />
                            <span>Phân bón & Dinh dưỡng đặc thù khuyên dùng</span>
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Kali trắng Sulphate, Bo - Canxi, NPK Đầu Trâu (phân cách dấu phẩy)"
                          value={formData.recommendedMaterials}
                          onChange={(e) => setFormData({ ...formData, recommendedMaterials: e.target.value })}
                          className="crop-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB 3: QUY TRÌNH SINH TRƯỞNG --- */}
                {formActiveTab === 'STAGES' && (
                  <div className="tab-pane-content">
                    <div className="crop-form-section" style={{ borderBottom: 'none' }}>
                      <div className="stages-builder-header">
                        <div>
                          <h4 className="section-subtitle" style={{ margin: 0 }}>
                            <IconClock size={16} strokeWidth={2.2} />
                            <span>Quy Trình Sinh Trưởng ({formData.stages.length} giai đoạn)</span>
                          </h4>
                          <p className="stages-builder-desc">Tùy biến các giai đoạn phát triển và số ngày chuẩn cho cây</p>
                        </div>
                        <button
                          type="button"
                          className="btn-add-stage"
                          onClick={handleAddStage}
                        >
                          <IconPlus size={14} strokeWidth={2.4} />
                          <span>Thêm giai đoạn</span>
                        </button>
                      </div>

                      <div className="stages-builder-list">
                        {formData.stages.map((st, idx) => (
                          <div key={idx} className="stage-builder-card">
                            <div className="stage-builder-top">
                              <span className="stage-num-badge">Giai đoạn {idx + 1}</span>
                              <button
                                type="button"
                                className="btn-remove-stage-item"
                                onClick={() => handleRemoveStage(idx)}
                                title="Xóa giai đoạn này"
                              >
                                <IconTrash size={14} strokeWidth={2} />
                              </button>
                            </div>

                            <div className="stage-fields-grid">
                              <div className="form-group" style={{ margin: 0 }}>
                                <label>Tên giai đoạn</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="VD: Nuôi trái non & Bón NPK..."
                                  value={st.name}
                                  onChange={(e) => handleUpdateStage(idx, 'name', e.target.value)}
                                  className="crop-input stage-input"
                                />
                              </div>

                              <div className="form-group" style={{ margin: 0 }}>
                                <label>Thời gian (ngày)</label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  placeholder="Số ngày"
                                  value={st.durationDays}
                                  onChange={(e) => handleUpdateStage(idx, 'durationDays', Number(e.target.value))}
                                  className="crop-input stage-input"
                                />
                              </div>
                            </div>

                            <div className="form-group" style={{ margin: '0.6rem 0 0 0' }}>
                              <label>Hướng dẫn kỹ thuật cần làm</label>
                              <input
                                type="text"
                                placeholder="VD: Bón phân NPK cân đối, phun thuốc phòng nấm, giữ ẩm gốc..."
                                value={st.desc}
                                onChange={(e) => handleUpdateStage(idx, 'desc', e.target.value)}
                                className="crop-input stage-input"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- FOOTER ACTIONS --- */}
                <div className="crop-modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Hủy bỏ
                  </button>

                  <div className="step-actions-group">
                    {formActiveTab === 'SPECS' && (
                      <button
                        type="button"
                        className="btn-step btn-prev"
                        onClick={() => setFormActiveTab('INFO')}
                      >
                        <IconArrowLeft size={15} strokeWidth={2.2} />
                        <span>Quay lại</span>
                      </button>
                    )}

                    {formActiveTab === 'STAGES' && (
                      <button
                        type="button"
                        className="btn-step btn-prev"
                        onClick={() => setFormActiveTab('SPECS')}
                      >
                        <IconArrowLeft size={15} strokeWidth={2.2} />
                        <span>Quay lại</span>
                      </button>
                    )}

                    {formActiveTab === 'INFO' && (
                      <button
                        type="button"
                        className="btn-step btn-next"
                        onClick={() => setFormActiveTab('SPECS')}
                      >
                        <span>Sang Thông Số</span>
                        <IconArrowRight size={15} strokeWidth={2.2} />
                      </button>
                    )}

                    {formActiveTab === 'SPECS' && (
                      <button
                        type="button"
                        className="btn-step btn-next"
                        onClick={() => setFormActiveTab('STAGES')}
                      >
                        <span>Sang Quy Trình</span>
                        <IconArrowRight size={15} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang lưu...' : editingCrop ? 'Cập Nhật' : 'Lưu Cây Trồng'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= DRAWER: CHI TIẾT KỸ THUẬT & CHU KỲ SINH TRƯỞNG ================= */}
        {selectedCropDetail && (
          <div className="crop-modal-backdrop" onClick={() => setSelectedCropDetail(null)}>
            <div className="crop-detail-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <div className="drawer-title-box">
                  <div className="drawer-icon-box">
                    {renderCropCategoryIcon(selectedCropDetail.type, selectedCropDetail.name, 26)}
                  </div>
                  <div>
                    <h2>{selectedCropDetail.name}</h2>
                    <span className="drawer-badge">{selectedCropDetail.type}</span>
                  </div>
                </div>
                <button className="crop-modal-close" onClick={() => setSelectedCropDetail(null)}>
                  <IconX size={18} strokeWidth={2.2} />
                </button>
              </div>

              <div className="drawer-body">
                <div className="drawer-cover">
                  <img src={selectedCropDetail.meta.image} alt={selectedCropDetail.name} />
                  <div className="drawer-cover-overlay">
                    <p>{selectedCropDetail.meta.description}</p>
                  </div>
                </div>

                {/* 3 Cột thống số canh tác chuyên sâu */}
                <div className="drawer-specs-grid">
                  <div className="drawer-spec-card">
                    <span className="spec-label">Mật độ canh tác</span>
                    <strong className="spec-val">{selectedCropDetail.meta.density || 'Theo quy cách nông hộ'}</strong>
                  </div>
                  <div className="drawer-spec-card">
                    <span className="spec-label">Thời gian thu hoạch</span>
                    <strong className="spec-val">{selectedCropDetail.meta.harvestDuration || 'Theo chu kỳ mùa vụ'}</strong>
                  </div>
                  <div className="drawer-spec-card">
                    <span className="spec-label">Đơn vị sản phẩm</span>
                    <strong className="spec-val">{selectedCropDetail.meta.harvestUnit || 'Kg quả tươi'}</strong>
                  </div>
                </div>

                {/* Cảnh báo sâu bệnh hại */}
                {selectedCropDetail.meta.commonPests && (
                  <div className="drawer-pest-card">
                    <div className="pest-card-title">
                      <IconAlertTriangle size={18} strokeWidth={2.2} />
                      <span>Sâu bệnh hại nguy hiểm & Lưu ý kiểm tra</span>
                    </div>
                    <p className="pest-card-desc">{selectedCropDetail.meta.commonPests}</p>
                  </div>
                )}

                {/* Quy trình sinh trưởng chi tiết */}
                <div className="drawer-section">
                  <div className="section-title-wrap">
                    <div className="section-title-box">
                      <IconClock size={18} strokeWidth={2.2} />
                      <h3>Quy Trình Các Giai Đoạn Sinh Trưởng Chuẩn</h3>
                    </div>
                    <span className="section-tag">
                      {selectedCropDetail.meta.stages ? selectedCropDetail.meta.stages.length : 0} giai đoạn
                    </span>
                  </div>

                  <div className="drawer-timeline">
                    {selectedCropDetail.meta.stages &&
                      selectedCropDetail.meta.stages.map((stage, idx) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-dot-wrap">
                            <div className="timeline-dot">{idx + 1}</div>
                            {idx < selectedCropDetail.meta.stages.length - 1 && <div className="timeline-line" />}
                          </div>
                          <div className="timeline-card">
                            <div className="timeline-card-header">
                              <h4>{stage.name}</h4>
                              <span className="timeline-days-badge">
                                <IconClock size={12} strokeWidth={2} />
                                <span>{stage.durationDays} ngày</span>
                              </span>
                            </div>
                            <p className="timeline-card-desc">{stage.desc}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Vật tư phân thuốc khuyến nghị */}
                {selectedCropDetail.meta.recommendedMaterials && (
                  <div className="drawer-section">
                    <div className="section-title-box">
                      <IconFlask size={18} strokeWidth={2.2} />
                      <h3>Phân Bón & Vật Tư Nông Nghiệp Khuyên Dùng</h3>
                    </div>
                    <div className="materials-tags-grid">
                      {(Array.isArray(selectedCropDetail.meta.recommendedMaterials)
                        ? selectedCropDetail.meta.recommendedMaterials
                        : selectedCropDetail.meta.recommendedMaterials.split(',')
                      ).map((mat, idx) => (
                        <div key={idx} className="material-tag-item">
                          <IconCheckCircle size={14} strokeWidth={2.2} />
                          <span>{typeof mat === 'string' ? mat.trim() : mat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="drawer-footer">
                <button className="crops-btn-secondary" onClick={() => setSelectedCropDetail(null)}>
                  Đóng Chi Tiết
                </button>
                <button
                  className="crops-btn-primary"
                  onClick={() => {
                    const target = selectedCropDetail;
                    setSelectedCropDetail(null);
                    handleOpenForm(target);
                  }}
                >
                  <IconPenLine size={16} strokeWidth={2.2} />
                  <span>Chỉnh Sửa Thông Số</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

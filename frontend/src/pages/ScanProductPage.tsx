import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileImage,
  X,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { ApiService } from '../services/api';

export const ScanProductPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Food & Beverages');
  const [declaredNetQty, setDeclaredNetQty] = useState('');
  const [declaredMRP, setDeclaredMRP] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('India');
  const [labelType, setLabelType] = useState('front');
  const [stateLocation, setStateLocation] = useState('Delhi NCT');

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const sampleProducts = [
    {
      label: "Chips Ahoy! Real Chocolate Chip Cookies (Compliant Specimen)",
      brand: "Chips Ahoy / Mondelēz",
      name: "Original Real Chocolate Chip Cookies",
      category: "Food & Beverages",
      netQty: "100 g",
      mrp: "200",
      origin: "India",
      sampleFilename: "chips_ahoy_original.jpg"
    },
    {
      label: "Coca-Cola 12 fl oz (355ml Can Specimen)",
      brand: "The Coca-Cola Company",
      name: "Coca-Cola Original Carbonated Beverage",
      category: "Food & Beverages",
      netQty: "355 ml",
      mrp: "40",
      origin: "USA / India",
      sampleFilename: "coca_cola_12oz.jpg"
    },
    {
      label: "Skinny Cow Divines Caramel Filled Chocolate 149.6g",
      brand: "Nestlé Skinny Cow",
      name: "Divines Caramel Filled Chocolate Squares",
      category: "Food & Beverages",
      netQty: "149.6 g",
      mrp: "180",
      origin: "USA / India",
      sampleFilename: "skinny_cow_caramel.jpg"
    },
    {
      label: "Haldiram's Aloo Bhujia 150g (Compliant)",
      brand: "Haldiram's",
      name: "Aloo Bhujia Crispy Snacks",
      category: "Food & Beverages",
      netQty: "150 g",
      mrp: "50",
      origin: "India",
      sampleFilename: "sample_chips_compliant.jpg"
    },
    {
      label: "Parle-G Biscuits 250g (Missing MRP Violation)",
      brand: "Parle-G",
      name: "Glucose Milk Biscuits",
      category: "Food & Beverages",
      netQty: "250 g",
      mrp: "",
      origin: "India",
      sampleFilename: "sample_biscuit_missing_mrp.jpg"
    },
    {
      label: "Tata Sampann Mustard Oil 1L (Needs Review)",
      brand: "Tata Sampann",
      name: "Cold Pressed Pure Mustard Oil",
      category: "Edible Oils",
      netQty: "1 L",
      mrp: "195",
      origin: "India",
      sampleFilename: "sample_oil_incomplete_address.jpg"
    },
    {
      label: "Cadbury Swiss Truffles (Missing Origin Violation)",
      brand: "Cadbury",
      name: "Swiss Truffles Dark Confection",
      category: "Confectionery",
      netQty: "200 g",
      mrp: "250",
      origin: "Imported",
      sampleFilename: "sample_imported_no_origin.jpg"
    },
    {
      label: "Himalaya Face Wash 8ml (Rule 26 Exempt)",
      brand: "Himalaya",
      name: "Purifying Neem Face Wash Mini",
      category: "Cosmetics",
      netQty: "8 ml",
      mrp: "15",
      origin: "India",
      sampleFilename: "sample_cosmetic_exempt.jpg"
    }
  ];

  const handleFiles = (incomingFiles: FileList | File[]) => {
    setError(null);
    const newFiles = Array.from(incomingFiles).filter((f) => {
      const ext = f.name.toLowerCase();
      return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.webp');
    });

    if (newFiles.length === 0) {
      setError('Please upload valid packaging images (JPG, PNG, or WEBP).');
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviews((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectSample = async (sample: typeof sampleProducts[0]) => {
    setBrand(sample.brand);
    setProductName(sample.name);
    setCategory(sample.category);
    setDeclaredNetQty(sample.netQty);
    setDeclaredMRP(sample.mrp);
    setCountryOfOrigin(sample.origin);
    setError(null);

    try {
      // First try /sample_images/ then fallback to /backend/sample_images/
      let response = await fetch(`/sample_images/${sample.sampleFilename}`);
      if (!response.ok || !response.headers.get('content-type')?.includes('image')) {
        response = await fetch(`/backend/sample_images/${sample.sampleFilename}`);
      }
      const blob = await response.blob();
      const file = new File([blob], sample.sampleFilename, { type: blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg' });
      setFiles([file]);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviews([e.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to load sample image', err);
      setError('Could not load sample specimen image. Please browse an image file directly.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please upload at least one product label photograph.');
      return;
    }
    if (!productName.trim() || !brand.trim()) {
      setError('Product Name and Brand are mandatory for statutory record.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Step 1: Upload & Preprocess
      setProcessingStep('Step 1/4: Uploading packaging image & running OpenCV preprocessing (denoising, CLAHE contrast)...');
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      formData.append('product_name', productName);
      formData.append('brand', brand);
      formData.append('category', category);
      if (declaredNetQty) formData.append('declared_net_quantity', declaredNetQty);
      if (declaredMRP) formData.append('declared_mrp', declaredMRP);
      formData.append('country_of_origin', countryOfOrigin);
      formData.append('label_type', labelType);
      formData.append('state_location', stateLocation);

      const uploadRes = await ApiService.uploadInspection(formData);
      const inspectionId = uploadRes.inspection_id;

      // Step 2: OCR Extraction
      setProcessingStep('Step 2/4: Executing multi-engine OCR text & bounding box extraction...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: Classification & Compliance
      setProcessingStep('Step 3/4: Classifying mandatory declarations & applying Packaged Commodities Rules 2011...');
      const processRes = await ApiService.processInspection(inspectionId);

      // Step 4: Generating ReportLab PDF
      setProcessingStep('Step 4/4: Generating official statutory compliance PDF report...');
      await new Promise((r) => setTimeout(r, 400));

      // Done -> Navigate to Compliance Analysis View
      navigate(`/compliance?id=${inspectionId}`);
    } catch (err: any) {
      console.error('Processing failed', err);
      let errorMsg = 'An error occurred during inspection processing.';
      if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          errorMsg = detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
        } else if (typeof detail === 'object') {
          errorMsg = JSON.stringify(detail);
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-govNavy-900 dark:text-white flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-deepBlue dark:text-cyanAccent" />
            AI Product Packaging Scanner
          </h2>
          <p className="text-sm text-slate-500">
            Automated image enhancement, OCR text extraction, and statutory Legal Metrology compliance verification.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:inline">
            Quick Specimen:
          </span>
          <select
            onChange={(e) => {
              const selected = sampleProducts.find((p) => p.label === e.target.value);
              if (selected) handleSelectSample(selected);
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cardBgDark text-govNavy-900 dark:text-white shadow-sm focus:ring-2 focus:ring-deepBlue outline-none"
            defaultValue=""
          >
            <option value="" disabled>
              Select Sample Specimen...
            </option>
            {sampleProducts.map((p, i) => (
              <option key={i} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-errorRed flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Processing Animated Modal */}
      {isProcessing && (
        <div className="p-8 rounded-2xl bg-white dark:bg-cardBgDark border border-blue-200 dark:border-blue-900 shadow-xl text-center space-y-5">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full border-4 border-blue-100 dark:border-blue-950 border-t-deepBlue animate-spin" />
            <ScanLine className="w-8 h-8 text-deepBlue dark:text-cyanAccent absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-govNavy-900 dark:text-white">
              AI Inspection Engine in Progress
            </h3>
            <p className="text-sm text-deepBlue dark:text-cyanAccent font-medium mt-1">
              {processingStep}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Processing through OpenCV Computer Vision & Legal Metrology Rule Validator...
            </p>
          </div>
        </div>
      )}

      {!isProcessing && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Drag & Drop Upload + Previews (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
              }}
              className={`p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px] ${
                isDragging
                  ? 'border-deepBlue bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-cardBgDark hover:border-slate-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />

              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-deepBlue dark:text-cyanAccent flex items-center justify-center mb-3 shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>

              <h4 className="text-base font-bold text-govNavy-900 dark:text-white mb-1">
                Drag and drop product packaging label images
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Supported formats: <strong>JPG, JPEG, PNG, WEBP</strong> (up to 25MB). Upload front, back, or side panel photographs.
              </p>

              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-200 transition-colors"
              >
                Browse Files
              </button>
            </div>

            {/* Uploaded Thumbnails Preview Grid */}
            {previews.length > 0 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Selected Packaging Evidence ({previews.length} image{previews.length > 1 ? 's' : ''})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFiles([]);
                      setPreviews([]);
                    }}
                    className="text-errorRed hover:underline text-xs"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 h-32">
                      <img src={src} alt={`Preview ${idx}`} className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-950/70 text-white hover:bg-errorRed transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Metadata Form (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-govNavy-900 dark:text-white">
                Commodity Inspection Details
              </h3>
              <p className="text-xs text-slate-500">
                Statutory parameters for Legal Metrology audit record
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product / Commodity Name <span className="text-errorRed">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aloo Bhujia Crispy Snacks"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand / Manufacturer <span className="text-errorRed">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Haldiram's"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Commodity Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                  >
                    <option value="Food & Beverages">Food & Beverages</option>
                    <option value="Edible Oils">Edible Oils</option>
                    <option value="Confectionery">Confectionery</option>
                    <option value="Cosmetics">Cosmetics & Personal Care</option>
                    <option value="Cleaning Products">Soaps & Detergents</option>
                    <option value="General">Other Packaged Commodities</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Net Quantity (Stated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 150 g / 1 L"
                    value={declaredNetQty}
                    onChange={(e) => setDeclaredNetQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Declared MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 50.00"
                    value={declaredMRP}
                    onChange={(e) => setDeclaredMRP(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Label Display Panel
                  </label>
                  <select
                    value={labelType}
                    onChange={(e) => setLabelType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                  >
                    <option value="front">Principal Display Panel (Front)</option>
                    <option value="back">Back Information Panel</option>
                    <option value="mrp_panel">MRP & Batch Crimp Panel</option>
                    <option value="side">Side Panel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enforcement Jurisdiction / State
                </label>
                <select
                  value={stateLocation}
                  onChange={(e) => setStateLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                >
                  <option value="Delhi NCT">Delhi NCT</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Gujarat">Gujarat</option>
                </select>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={files.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-deepBlue hover:bg-deepBlue-hover text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <ScanLine className="w-4 h-4" />
                <span>Run AI OCR & Legal Compliance Check</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};


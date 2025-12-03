
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Model } from '../types';
import { ChevronDown, X } from 'lucide-react';
import { useAppStore } from '../store';

interface HeaderModelSelectorProps {
  isMobile: boolean;
}

export const HeaderModelSelector: React.FC<HeaderModelSelectorProps> = ({ isMobile }) => {
  const { 
      selectedModel,
      setSelectedModel,
      isDeepResearchToggled,
      isCodeInterpreterActive,
      isImageToolActive,
      isVideoToolActive,
   } = useAppStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
    const chatModelNameMap: Partial<Record<Model, string>> = {
    [Model.GEMINI_3_PRO_PREVIEW]: 'Gemini 3 Pro Preview',
    [Model.GEMINI_2_5_PRO]: 'Gemini 2.5 Pro', 
    [Model.GEMINI_2_5_FLASH]: 'Gemini 2.5 Flash', 
    [Model.GEMINI_2_5_FLASH_LITE]: 'Gemini 2.5 Flash-Lite',
    [Model.GEMINI_2_0_FLASH]: 'Gemini 2.0 Flash', 
    [Model.GEMINI_2_0_FLASH_LITE]: 'Gemini 2.0 Flash-Lite',
  };

  const imageGenerationModelNameMap: Partial<Record<Model, string>> = {
    [Model.IMAGEN_4_0_ULTRA_GENERATE_001]: 'Imagen 4 Ultra',
    [Model.IMAGEN_4_0_GENERATE_001]: 'Imagen 4',
    [Model.IMAGEN_4_0_FAST_GENERATE_001]: 'Imagen 4 Fast',
    [Model.IMAGEN_3_0_GENERATE_002]: 'Imagen 3',
  };

  const imageEditingModelNameMap: Partial<Record<Model, string>> = {
    [Model.GEMINI_3_PRO_IMAGE_PREVIEW]: 'Gemini 3 Pro Image',
    [Model.GEMINI_2_5_FLASH_IMAGE]: 'Gemini 2.5 Flash Image',
    [Model.GEMINI_2_0_FLASH_IMAGE_PREVIEW]: 'Flash 2.0 Preview Image',
  };

  const videoGenerationModelNameMap: Partial<Record<Model, string>> = {
    [Model.VEO_3_0_GENERATE_PREVIEW]: 'Veo 3 Preview',
    [Model.VEO_3_0_FAST_GENERATE_PREVIEW]: 'Veo 3 Fast Preview',
    [Model.VEO_2_0_GENERATE_001]: 'Veo 2',
  };

  const modelOptions = useMemo(() => (Object.keys(chatModelNameMap) as Model[]).map(modelKey => ({ value: modelKey, label: chatModelNameMap[modelKey]! })), [chatModelNameMap]);
  const deepResearchCompatibleModels: (Model | string)[] = [Model.GEMINI_3_PRO_PREVIEW, Model.GEMINI_2_5_PRO, Model.GEMINI_2_5_FLASH];
  const codeInterpreterCompatibleModels: (Model | string)[] = [
    Model.GEMINI_3_PRO_PREVIEW,
    Model.GEMINI_2_5_PRO,
    Model.GEMINI_2_5_FLASH,
    Model.GEMINI_2_5_FLASH_LITE,
    Model.GEMINI_2_0_FLASH,
    Model.GEMINI_2_0_FLASH_LITE,
  ];

  const combinedModelOptions = useMemo(() => {
    // Handle mutually exclusive tools first (image/video gen don't support custom sources)
    if (isVideoToolActive) {
      return (Object.keys(videoGenerationModelNameMap) as Model[]).map(modelKey => ({ value: modelKey, label: videoGenerationModelNameMap[modelKey]! }));
    }

    if (isImageToolActive) {
      const genOptions = (Object.keys(imageGenerationModelNameMap) as Model[]).map(modelKey => ({ value: modelKey, label: imageGenerationModelNameMap[modelKey]! }));
      const editOptions = (Object.keys(imageEditingModelNameMap) as Model[]).map(modelKey => ({ value: modelKey, label: imageEditingModelNameMap[modelKey]! }));
      return [...genOptions, ...editOptions];
    }

    let filteredBaseOptions = modelOptions;

    // Filter base models if a compatible tool is active
    if (isDeepResearchToggled) {
        filteredBaseOptions = modelOptions.filter(opt => deepResearchCompatibleModels.includes(opt.value as Model));
    } else if (isCodeInterpreterActive) { // use else if as they are mutually exclusive in the store
        filteredBaseOptions = modelOptions.filter(opt => codeInterpreterCompatibleModels.includes(opt.value as Model));
    }
    
    return filteredBaseOptions;

  }, [modelOptions, isDeepResearchToggled, isCodeInterpreterActive, isImageToolActive, isVideoToolActive]);

  const allBaseModelsMap = useMemo(() => ({
    ...chatModelNameMap,
    ...imageGenerationModelNameMap,
    ...imageEditingModelNameMap,
    ...videoGenerationModelNameMap,
  }), []);

  const selectedLabel = useMemo(() => {
      return allBaseModelsMap[selectedModel as Model] || selectedModel;
  }, [selectedModel, allBaseModelsMap]);

  const renderOptions = () => {
    const baseModels = combinedModelOptions;
    
    const handleSelect = (value: string) => {
        setSelectedModel(value);
        setIsOpen(false);
    }
    
    const renderOption = (option: { value: string; label: string }) => (
      <div
        key={option.value}
        onClick={() => handleSelect(option.value)}
        className={`flex items-center justify-between px-3 py-2 text-sm text-text-primary cursor-pointer rounded-lg ${
          option.value === selectedModel
            ? 'bg-interactive-hover font-medium'
            : 'hover:bg-interactive-hover'
        }`}
        role="option"
        aria-selected={option.value === selectedModel}
      >
        <span className="truncate">{option.label}</span>
      </div>
    );
    
    return (
        <div className="p-1">
          <div className="px-3 py-1 text-xs font-semibold text-text-secondary uppercase tracking-wider">Base Models</div>
          {baseModels.map(renderOption)}
        </div>
    );
  };

  if (isMobile && isOpen) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)}></div>
        <div className="fixed bottom-0 left-0 right-0 bg-background rounded-t-lg z-50 p-4 max-h-[50vh] flex flex-col shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-text-primary">Select a Model</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 text-text-secondary hover:text-text-primary">
              <X className="h-5 w-5"/>
            </button>
          </div>
          <div className="overflow-y-auto hover-scrollbar space-y-1">
            {renderOptions()}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full md:w-[17.5rem] flex items-center justify-between px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-interactive-hover transition-colors`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {isOpen && !isMobile && (
        <div className="absolute z-10 top-full mt-1 w-full md:w-[19.5rem] bg-background border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto hover-scrollbar [scrollbar-gutter:stable]" role="listbox">
          {renderOptions()}
        </div>
      )}
    </div>
  );
};
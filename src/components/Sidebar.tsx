
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Model, MediaResolution } from '../types';
import { ChevronDown } from 'lucide-react';
import { useAppStore } from '../store';

interface SidebarProps {
  isSidebarOpen: boolean;
  isMobile: boolean;
  modelMaxTokens: number;
}

const Dropdown: React.FC<{
  label: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}> = ({ label, options, selectedValue, onSelect, disabled = false }) => {
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

  const selectedLabel = options.find(opt => opt.value === selectedValue)?.label || selectedValue;

  return (
    <div className="mb-4 relative" ref={dropdownRef}>
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block px-1">{label}</label>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 border border-border rounded-lg ${
          disabled
            ? 'bg-card cursor-not-allowed'
            : 'bg-background hover:bg-interactive-hover cursor-pointer'
        } focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent`}
        disabled={disabled}
      >
        <span className={`text-sm truncate ${disabled ? 'text-text-secondary' : 'text-text-primary'}`}>{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && !disabled && (
        <div className="absolute z-10 top-full mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto hover-scrollbar [scrollbar-gutter:stable]">
          {options.map(option => (
            <div
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className="px-3 py-2 text-sm text-text-primary hover:bg-interactive-hover cursor-pointer truncate"
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-t border-border pt-4 mt-4">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center mb-4">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</h3>
        <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="space-y-4">{children}</div>}
    </div>
  );
};

const SliderInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}> = ({ label, value, onChange, min, max, step }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            const progress = ((value - min) / (max - min)) * 100;
            inputRef.current.style.setProperty('--progress', `${progress}%`);
        }
    }, [value, min, max]);

    return (
        <div>
            <label className="text-sm font-medium text-text-primary flex justify-between items-center">
            <span>{label}</span>
            </label>
            <div className="flex items-center gap-2 mt-2">
            <input
                ref={inputRef}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full custom-slider focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] rounded-lg"
            />
            <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-20 p-1 border border-border bg-card text-text-primary rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent"
            />
            </div>
        </div>
    );
};

const ToggleSwitch: React.FC<{
    label: string;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    description?: React.ReactNode;
    disabled?: boolean;
}> = ({ label, enabled, onToggle, description, disabled = false }) => (
    <div className="flex items-center justify-between">
        <div>
            <span className={`text-sm font-medium ${disabled ? 'text-text-secondary/70' : 'text-text-primary'}`}>{label}</span>
            {description && <div className="text-xs text-text-secondary">{description}</div>}
        </div>
        <button
            type="button"
            onClick={() => !disabled && onToggle(!enabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-text-secondary focus:ring-offset-2 focus:ring-offset-background dark:focus:ring-offset-card ${
                enabled ? 'bg-text-secondary' : 'bg-interactive-hover dark:bg-card'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            role="switch"
            aria-checked={enabled}
            disabled={disabled}
        >
            <span
                aria-hidden="true"
                className={`${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition-transform duration-200 ease-in-out`}
            />
        </button>
    </div>
);


export const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, isMobile, modelMaxTokens }) => {
  const store = useAppStore();
  const { currentUser, showLoginPrompt } = useAppStore();
  const isGuest = currentUser?.isGuest;

  const activeBaseModel = useMemo<Model>(() => {
    const selected = store.selectedModel;
    if (Object.values(Model).includes(selected as Model)) {
        return selected as Model;
    }
    return Model.GEMINI_2_5_FLASH; // Sensible default
  }, [store.selectedModel]);
  
  const isTextToImageModel = useMemo(() => activeBaseModel ? [
    Model.IMAGEN_4_0_GENERATE_001, 
    Model.IMAGEN_4_0_ULTRA_GENERATE_001, 
    Model.IMAGEN_4_0_FAST_GENERATE_001, 
    Model.IMAGEN_3_0_GENERATE_002
].includes(activeBaseModel as Model) : false, [activeBaseModel]);
  
  const isImageEditModel = useMemo(() => 
    activeBaseModel === Model.GEMINI_3_PRO_IMAGE_PREVIEW ||
    activeBaseModel === Model.GEMINI_2_5_FLASH_IMAGE ||
    activeBaseModel === Model.GEMINI_2_0_FLASH_IMAGE_PREVIEW, [activeBaseModel]);
    
  const isVideoModel = useMemo(() => activeBaseModel ? [Model.VEO_2_0_GENERATE_001, Model.VEO_3_0_GENERATE_PREVIEW, Model.VEO_3_0_FAST_GENERATE_PREVIEW].includes(activeBaseModel as Model) : false, [activeBaseModel]);
  
  const isThinkingModel = useMemo(() => activeBaseModel ? [
      Model.GEMINI_3_PRO_PREVIEW,
      Model.GEMINI_2_5_PRO, 
      Model.GEMINI_2_5_FLASH, 
      Model.GEMINI_2_5_FLASH_LITE
    ].includes(activeBaseModel) : false, [activeBaseModel]);
    
  const isAlwaysThinkingModel = useMemo(() => 
    activeBaseModel === Model.GEMINI_2_5_PRO || 
    activeBaseModel === Model.GEMINI_3_PRO_PREVIEW, 
  [activeBaseModel]);

  const mediaResolutionOptions = [
    { value: MediaResolution.DEFAULT, label: 'Default' },
    { value: MediaResolution.LOW, label: 'Low' },
    { value: MediaResolution.MEDIUM, label: 'Medium' },
    { value: MediaResolution.HIGH, label: 'High (Zoomed Reframing)' },
  ];
  
  // Max thinking budget varies by model capability
  const maxThinkingBudget = isAlwaysThinkingModel ? 32768 : 24576;
  
  const isAnyImageModel = isImageEditModel || isTextToImageModel;

  const renderContent = () => {
    if (isAnyImageModel) {
      if (isImageEditModel) {
        return (
           <div className="px-1">
            <div className="mb-4">
               <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block px-1">Output format</label>
               <div className="w-full p-3 border border-border rounded-lg bg-card">
                  <span className="text-sm text-text-primary">Image & text</span>
               </div>
            </div>
  
            <div className="border-t border-border pt-4 mt-4 space-y-4">
              <div className="flex justify-between items-center text-sm text-text-primary">
                  <span>Token count</span>
                  <span className="text-text-secondary">N/A</span>
              </div>
  
              <SliderInput
                  label="Temperature"
                  value={store.temperature}
                  onChange={store.setTemperature}
                  min={0} max={2} step={0.01}
              />
            </div>
  
            <CollapsibleSection title="Advanced settings">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">Safety settings</span>
                    <button className="text-accent hover:underline">Edit</button>
                </div>
                <div>
                    <label className="text-sm font-medium text-text-primary block mb-2">Add stop sequence</label>
                    <input
                        type="text"
                        value={store.stopSequence}
                        onChange={e => store.setStopSequence(e.target.value)}
                        placeholder="Add stop..."
                        className="w-full p-2 border border-border bg-background text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-text-primary block mb-2">Output length</label>
                    <input
                        type="number"
                        value={store.maxOutputTokens}
                        onChange={e => store.setMaxOutputTokens(parseInt(e.target.value, 10))}
                        className="w-full p-2 border border-border bg-background text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent"
                    />
                </div>
                <SliderInput
                    label="Top P"
                    value={store.topP}
                    onChange={store.setTopP}
                    min={0} max={1} step={0.01}
                />
            </CollapsibleSection>
          </div>
        )
      }
      return (
        <div className="px-1">
          <div className="border-t border-border pt-4 mt-4 space-y-4">
            <div className="flex justify-between items-center text-sm text-text-primary">
                <span>Token count</span>
                <span className="text-text-secondary">N/A</span>
            </div>
            <SliderInput
              label="Number of images"
              value={store.numberOfImages}
              onChange={store.setNumberOfImages}
              min={1} max={4} step={1}
            />
            <Dropdown
              label="Aspect Ratio"
              options={[
                { value: '1:1', label: '1:1 (Square)' },
                { value: '16:9', label: '16:9 (Widescreen)' },
                { value: '9:16', label: '9:16 (Vertical)' },
                { value: '4:3', label: '4:3 (Landscape)' },
                { value: '3:4', label: '3:4 (Portrait)' },
              ]}
              selectedValue={store.aspectRatio}
              onSelect={store.setAspectRatio}
            />
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block px-1">
                Negative Prompt
              </label>
              <textarea
                value={store.negativePrompt}
                onChange={(e) => store.setNegativePrompt(e.target.value)}
                placeholder="Describe what you don't want to see"
                rows={2}
                className="w-full p-2 border border-border rounded-lg text-sm text-text-primary bg-background resize-y focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent"
                aria-label="Negative Prompt"
              />
            </div>
          </div>

          <CollapsibleSection title="Advanced settings">
              <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">Seed</label>
                  <input
                      type="number"
                      value={store.seed ?? ''}
                      onChange={e => store.setSeed(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      placeholder="Random"
                      className="w-full p-2 border border-border bg-background text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent"
                  />
              </div>
              <Dropdown
                  label="Person Generation"
                  options={[
                    { value: 'allow_all', label: 'Allow Adults & Children' },
                    { value: 'allow_adult', label: 'Allow Adults Only' },
                    { value: 'dont_allow', label: 'Don\'t Allow People' },
                  ]}
                  selectedValue={store.personGeneration}
                  onSelect={store.setPersonGeneration}
              />
              <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-text-primary">Safety settings</span>
                  <button className="text-accent hover:underline">Edit</button>
              </div>
          </CollapsibleSection>
        </div>
      );
    }
    
    if (isVideoModel) {
      return (
        <div className="px-1">
          <div className="mb-4">
             <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block px-1">Output format</label>
             <div className="w-full p-3 border border-border rounded-lg bg-card">
                <span className="text-sm text-text-primary">Video</span>
             </div>
          </div>
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex justify-between items-center text-sm text-text-primary">
              <span>Token count</span>
              <span className="text-text-secondary">N/A</span>
            </div>
            <p className="text-xs text-text-secondary mt-3">Video generation settings are managed by the model.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="px-1">
        <div className="mb-4">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block px-1">
            System Instruction
          </label>
          <textarea
            value={store.systemInstruction}
            onChange={(e) => store.setSystemInstruction(e.target.value)}
            placeholder="You are a helpful assistant."
            rows={1}
            className="w-full p-3 border border-border rounded-lg text-sm text-text-primary bg-background focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent resize-y min-h-[46px] align-middle disabled:cursor-not-allowed disabled:bg-card"
            aria-label="System Instruction"
          />
        </div>

        <div className="border-t border-border pt-4 mt-4 space-y-4">
          <div className="flex justify-between items-center text-sm text-text-primary">
              <span>Token count</span>
              <span className="text-text-secondary">{store.tokenCount.toLocaleString()} / {modelMaxTokens.toLocaleString()}</span>
          </div>

          <SliderInput
              label="Temperature"
              value={store.temperature}
              onChange={store.setTemperature}
              min={0} max={2} step={0.01}
          />

          <Dropdown
            label="Media resolution"
            options={mediaResolutionOptions}
            selectedValue={store.mediaResolution}
            onSelect={(val) => store.setMediaResolution(val as MediaResolution)}
          />
        </div>

        {isThinkingModel && (
          <div className="border-t border-border pt-4 mt-4 space-y-4">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">Thinking</h3>
            <ToggleSwitch 
              label="Thinking"
              enabled={isAlwaysThinkingModel || store.useThinking}
              onToggle={store.setUseThinking}
              disabled={isAlwaysThinkingModel}
            />
            {(isAlwaysThinkingModel || store.useThinking) && (
              <>
                <ToggleSwitch 
                  label="Set thinking budget"
                  enabled={store.useThinkingBudget}
                  onToggle={store.setUseThinkingBudget}
                />
                {store.useThinkingBudget && (
                  <SliderInput
                    label="Thinking budget"
                    value={store.thinkingBudget}
                    onChange={store.setThinkingBudget}
                    min={0}
                    max={maxThinkingBudget}
                    step={1}
                  />
                )}
              </>
            )}
          </div>
        )}

        <CollapsibleSection title="Tools">
            <ToggleSwitch 
                label="Structured output" 
                enabled={store.useStructuredOutput}
                onToggle={store.setUseStructuredOutput}
                disabled={store.useGoogleSearch || isGuest}
                description={
                    <>
                        <button 
                            onClick={() => isGuest ? showLoginPrompt() : store.openSchemaModal()}
                            className="text-xs text-accent hover:underline disabled:text-text-secondary/70 disabled:no-underline disabled:cursor-not-allowed" 
                            disabled={!store.useStructuredOutput || isGuest}
                        >
                            Edit
                        </button>
                        {store.useGoogleSearch && <span className="text-xs text-text-secondary ml-2">(Unavailable with Google Search)</span>}
                        {isGuest && <span className="text-xs text-text-secondary ml-2">(Sign in to use)</span>}
                    </>
                }
            />
            <ToggleSwitch label="Code execution" enabled={store.useCodeExecution} onToggle={store.setUseCodeExecution} />
            <ToggleSwitch 
                label="Function calling"
                enabled={store.useFunctionCalling}
                onToggle={store.setUseFunctionCalling}
                description={<button className="text-xs text-accent hover:underline disabled:text-text-secondary/70 disabled:no-underline disabled:cursor-not-allowed" disabled={!store.useFunctionCalling}>Edit</button>}
            />
            <div>
              <ToggleSwitch
                  label="Grounding with Google Search"
                  enabled={store.useGoogleSearch}
                  onToggle={store.setUseGoogleSearch}
                  description={<span className="inline-flex items-center">Source: <img src="https://www.google.com/favicon.ico" alt="Google icon" className="w-3 h-3 mx-1"/> Google Search</span>}
              />
              <div className="mt-4">
                <ToggleSwitch 
                    label="URL context"
                    enabled={store.useUrlContext}
                    onToggle={store.setUseUrlContext}
                    disabled={!store.useGoogleSearch}
                    description={!store.useGoogleSearch && <span className="text-xs text-text-secondary">(Requires Google Search)</span>}
                />
                {store.useUrlContext && store.useGoogleSearch && (
                    <div className="mt-2">
                        <input
                            type="url"
                            value={store.urlContext}
                            onChange={e => store.setUrlContext(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full p-2 border border-border bg-background text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent"
                            aria-label="URL for context"
                        />
                    </div>
                )}
              </div>
            </div>
        </CollapsibleSection>

        <CollapsibleSection title="Advanced settings">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-text-primary">Safety settings</span>
                <button className="text-accent hover:underline">Edit</button>
            </div>
            <div>
                <label className="text-sm font-medium text-text-primary block mb-2">Add stop sequence</label>
                <input
                    type="text"
                    value={store.stopSequence}
                    onChange={e => store.setStopSequence(e.target.value)}
                    placeholder="Add stop..."
                    className="w-full p-2 border border-border bg-background text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent"
                />
            </div>
            <div>
                <label className="text-sm font-medium text-text-primary block mb-2">Output length</label>
                <input
                    type="number"
                    value={store.maxOutputTokens}
                    onChange={e => store.setMaxOutputTokens(parseInt(e.target.value, 10))}
                    className="w-full p-2 border border-border bg-background text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent"
                />
            </div>
            <SliderInput
                label="Top P"
                value={store.topP}
                onChange={store.setTopP}
                min={0} max={1} step={0.01}
            />
        </CollapsibleSection>
      </div>
    );
  };


  return (
    <aside className={`
      bg-background flex-shrink-0 overflow-hidden
      ${ isMobile
        ? `fixed top-14 bottom-0 right-0 z-30 w-[320px] border-l border-border transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 shadow-lg' : 'translate-x-full'}`
        : `border-border rounded-lg transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[320px] border ml-4' : 'w-0 border-none'}`
      }
    `}>
      <div className={`
        p-4 w-[320px] transition-opacity duration-150 ease-in-out overflow-y-auto h-full hover-scrollbar [scrollbar-gutter:stable]
        ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}
      `}>
        {renderContent()}
      </div>
    </aside>
  );
};

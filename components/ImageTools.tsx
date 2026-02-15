import React, { useState, useRef } from 'react';
import { generateAccessibleImage, editImageWithAi } from '../services/gemini';
import { ImageSize, AspectRatio } from '../types';

export default function ImageTools() {
  const [tab, setTab] = useState<'create' | 'edit'>('create');
  
  // Create State
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1K');
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  // Edit State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editedImage, setEditedImage] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);

  // Handlers
  const handleGenerate = async () => {
      if (!prompt) return;
      setLoading(true);
      try {
          const imgs = await generateAccessibleImage(prompt, size, ratio);
          setGeneratedImages(imgs);
      } catch (e) {
          console.error(e);
          alert("Generation failed");
      } finally {
          setLoading(false);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setSelectedFile(file);
          const reader = new FileReader();
          reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleEdit = async () => {
      if (!previewUrl || !editPrompt) return;
      setLoading(true);
      try {
          // Extract base64
          const base64Data = previewUrl.split(',')[1];
          const result = await editImageWithAi(base64Data, editPrompt, selectedFile?.type || 'image/jpeg');
          setEditedImage(result);
      } catch (e) {
          console.error(e);
          alert("Editing failed");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setTab('create')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                  Generate (Pro)
              </button>
              <button 
                onClick={() => setTab('edit')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                  Edit (Nano Banana)
              </button>
          </div>
      </div>

      <div className="p-4 max-w-xl mx-auto w-full space-y-6">
          {tab === 'create' ? (
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prompt</label>
                      <textarea 
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={3}
                        placeholder="Describe the image (e.g., An accessible ramp for a heritage building)"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Aspect Ratio</label>
                        <select 
                            value={ratio} 
                            onChange={(e) => setRatio(e.target.value as AspectRatio)}
                            className="w-full p-2 bg-white rounded-lg border border-slate-200"
                        >
                            {["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"].map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quality</label>
                        <select 
                            value={size} 
                            onChange={(e) => setSize(e.target.value as ImageSize)}
                            className="w-full p-2 bg-white rounded-lg border border-slate-200"
                        >
                            {["1K", "2K", "4K"].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                      </div>
                  </div>

                  <button 
                    onClick={handleGenerate}
                    disabled={loading || !prompt}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                      {loading ? 'Generating...' : 'Generate Image'}
                  </button>
                  
                  {generatedImages.length > 0 && (
                      <div className="mt-6 space-y-4">
                          <h3 className="font-bold text-slate-800">Result</h3>
                          {generatedImages.map((src, i) => (
                              <img key={i} src={src} alt="Generated" className="w-full rounded-xl shadow-md" />
                          ))}
                      </div>
                  )}
              </div>
          ) : (
              <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                      <input type="file" onChange={handleFileChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                      <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">add_photo_alternate</span>
                      <p className="text-sm text-slate-500 font-medium">Tap to upload a photo</p>
                  </div>

                  {previewUrl && (
                      <div className="space-y-4">
                          <img src={previewUrl} alt="Original" className="w-full rounded-xl shadow-sm border border-slate-100" />
                          
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Edit Instruction</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    placeholder="e.g., Add a retro filter, remove the car"
                                    className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button 
                                    onClick={handleEdit}
                                    disabled={loading || !editPrompt}
                                    className="bg-purple-600 text-white p-3 rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">auto_fix_high</span>}
                                </button>
                            </div>
                          </div>
                      </div>
                  )}

                  {editedImage && (
                      <div className="mt-6 space-y-2">
                          <h3 className="font-bold text-slate-800">Edited Result</h3>
                          <img src={editedImage} alt="Edited" className="w-full rounded-xl shadow-md border-4 border-purple-100" />
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
}

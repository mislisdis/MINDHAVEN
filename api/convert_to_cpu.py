import torch
import pickle
import io
import os
import struct

class CPU_Unpickler(pickle.Unpickler):
    def __init__(self, file, map_location='cpu'):
        super().__init__(file)
        self.map_location = map_location

    def find_class(self, module, name):
        if module == 'torch.storage' and name == '_load_from_bytes':
            return lambda b: torch.load(io.BytesIO(b), map_location=self.map_location, weights_only=False)
        else:
            return super().find_class(module, name)

def advanced_cpu_load(file_path):
    print(f"🔄 Advanced CPU loading for {file_path}...")
    
    try:
        # Read the entire file
        with open(file_path, 'rb') as f:
            data = f.read()
        
        # Try multiple approaches
        methods = [
            # Method 1: Custom unpickler
            lambda: CPU_Unpickler(io.BytesIO(data)).load(),
            
            # Method 2: Direct torch.load with bytes
            lambda: torch.load(io.BytesIO(data), map_location='cpu', weights_only=False),
            
            # Method 3: Try different pickle protocols
            lambda: pickle.loads(data),
            
            # Method 4: Manual handling for stubborn files
            lambda: torch.load(io.BytesIO(data), map_location=lambda storage, loc: storage),
        ]
        
        for i, method in enumerate(methods, 1):
            try:
                obj = method()
                print(f"✅ Success with method {i}")
                return obj
            except Exception as e:
                print(f"⚠️ Method {i} failed: {str(e)[:100]}...")
                continue
                
    except Exception as e:
        print(f"❌ All methods failed: {e}")
    
    return None

print("🚀 Starting advanced conversion...")
files = ["emotion_model.pkl", "tokenizer.pkl"]

for file in files:
    if not os.path.exists(file):
        print(f"❌ File not found: {file}")
        continue
        
    print(f"\n--- Processing {file} ---")
    obj = advanced_cpu_load(file)
    if obj is not None:
        new_name = file.replace(".pkl", "_cpu.pkl")
        try:
            with open(new_name, 'wb') as f:
                pickle.dump(obj, f, protocol=pickle.HIGHEST_PROTOCOL)
            print(f"✅ Created: {new_name}")
        except Exception as e:
            print(f"❌ Error saving {new_name}: {e}")
    else:
        print(f"❌ Failed to convert: {file}")

print("\n🎉 Advanced conversion complete!")
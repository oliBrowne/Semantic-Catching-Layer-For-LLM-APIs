import Atmosphere from '@/components/Atmosphere';
import Experience from '@/components/Experience';
import { SoundProvider } from '@/lib/audio/context';
import { AtmosphereProvider } from '@/lib/particles/context';

export default function Page() {
  return (
    <AtmosphereProvider>
      <SoundProvider>
        <Atmosphere />
        <Experience />
      </SoundProvider>
    </AtmosphereProvider>
  );
}

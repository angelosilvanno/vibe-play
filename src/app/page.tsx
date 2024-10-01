'use client';

import React, { useContext, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaForward, FaBackward, FaGithub, FaLinkedin } from 'react-icons/fa'; 
import { HomeContext } from './context/HomeContext';
import { musics, Music } from './dados/music';

const Home: React.FC = () => {
  
  const context = useContext(HomeContext);

  if (!context) {
    throw new Error('HomeContext must be used within a HomeContextProvider');
  }

  const [selectedMusic, setSelectedMusic] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentArtist, setCurrentArtist] = useState<string | null>(null);
  const [highlightedArtist, setHighlightedArtist] = useState<string | null>(null);
  const [volumeLevels, setVolumeLevels] = useState<{ [key: number]: number }>({});
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null); 
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Estado para controlar a visibilidade da mensagem de boas-vindas
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true); 

  useEffect(() => {
    // Limpa o áudio anterior quando a música selecionada muda
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.removeEventListener('play', () => setIsPlaying(true));
      audioRef.current.removeEventListener('pause', () => setIsPlaying(false));
    }

    if (selectedMusic !== null) {
      const music = musics.find((m) => m.id === selectedMusic);
      if (music) {
        // Cria um novo objeto Audio para cada música
        const newAudio = new Audio(music.urlAudio);
        audioRef.current = newAudio;

        // Define o volume e o mute
        newAudio.volume = volumeLevels[selectedMusic] ?? 1;
        newAudio.muted = isMuted;

        // Define os listeners de play e pause
        newAudio.addEventListener('play', () => setIsPlaying(true));
        newAudio.addEventListener('pause', () => setIsPlaying(false));

        // Reproduz a música se isPlaying for true
        if (isPlaying) {
          newAudio.play();
        }

        // Atualiza o título da aba com o nome da música + artista
        document.title = `${music.name} - ${music.artist}`; 
      }
    }
  }, [selectedMusic, isPlaying, volumeLevels[selectedMusic ?? -1], isMuted]);

  const handleMusicClick = (musicId: number) => {
    if (selectedMusic === musicId) {
      // Se a música já está selecionada, apenas pausa ou retoma a reprodução
      if (audioRef.current) {
        isPlaying ? audioRef.current.pause() : audioRef.current.play();
        setIsPlaying(!isPlaying);
      }
    } else {
      // Se a música é diferente, pausa a música anterior e reproduz a nova
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const music = musics.find((m) => m.id === musicId);
      if (music) {
        const newAudio = new Audio(music.urlAudio);
        audioRef.current = newAudio;
        newAudio.volume = volumeLevels[musicId] ?? 1;
        newAudio.muted = isMuted;
        setIsPlaying(true);
        newAudio.play();
      }

      setSelectedMusic(musicId);
       // **Atualizar o gênero ativo quando a música é clicada**
       const selectedMusicObj = musics.find((m) => m.id === musicId);
      if (selectedMusicObj) {
       setActiveGenre(selectedMusicObj.genre);
      }
    }
  };

  
  const handleVolumeChange = (musicId: number, e: React.FormEvent<HTMLInputElement>) => { 
    const newVolume = Number(e.currentTarget.value);
    setVolumeLevels((prev) => ({ ...prev, [musicId]: newVolume }));

    if (audioRef.current && selectedMusic === musicId) {
      audioRef.current.volume = newVolume; // Atualiza o volume imediatamente

      // Adiciona novamente os listeners de play e pause
      audioRef.current.addEventListener('play', () => setIsPlaying(true));
      audioRef.current.addEventListener('pause', () => setIsPlaying(false));
    }
  };

  const handleArtistClick = (artist: string) => {
    setCurrentArtist(artist);
    setHighlightedArtist(artist);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentArtist(null);
    setHighlightedArtist(null);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleBackward = () => {
    if (selectedMusic !== null && activeGenre !== null) {
      const musicIndex = musicByGenre[activeGenre].findIndex((m) => m.id === selectedMusic);
      const previousIndex = (musicIndex - 1 + musicByGenre[activeGenre].length) % musicByGenre[activeGenre].length; // Calcula o índice da música anterior
      setSelectedMusic(musicByGenre[activeGenre][previousIndex].id); // Seleciona a música anterior do gênero
    }
  };

  const handleForward = () => {
    if (selectedMusic !== null && activeGenre !== null) {
      const musicIndex = musicByGenre[activeGenre].findIndex((m) => m.id === selectedMusic);
      const nextIndex = (musicIndex + 1) % musicByGenre[activeGenre].length; // Calcula o índice da próxima música dentro do gênero
      setSelectedMusic(musicByGenre[activeGenre][nextIndex].id); // Seleciona a próxima música do gênero
    }
  };

  // Filtro de busca aplicado na lista completa de músicas
  const filteredMusics = musics.filter((music) =>
    music.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar músicas por gênero APÓS o filtro de busca
  const musicByGenre = filteredMusics.reduce((acc, music) => {
    if (!acc[music.genre]) {
      acc[music.genre] = [];
    }
    acc[music.genre].push(music);
    return acc;
  }, {} as { [key: string]: Music[] });

  // Restaura o título da aba para VibePlay quando a música termina
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', () => {
        document.title = 'VibePlay'; 
      });
    }
  }, []);
   
  // Esconde a mensagem de boas-vindas quando o usuário clica em uma aba
  const handleGenreClick = () => {
    setShowWelcomeMessage(false);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans"> 
      <header className="bg-gray-900 text-white py-4 shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-screen-lg mx-auto px-4 flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-bold text-gradient" style={{ fontFamily: '"Roboto", sans-serif' }}>VibePlay</h1> 
          {}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar música..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 placeholder-gray-500 focus:outline-none focus:ring focus:ring-green-600"
            />
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center p-4 bg-gradient-to-br from-gray-900 to-gray-800 pt-20 sm:pt-24 md:pt-32 pb-4">
        <div className="flex flex-col items-center w-full max-w-screen-lg">
          {/* Seção para a mensagem de boas-vindas */}
          {showWelcomeMessage && (
            <div className="text-center mb-8"> 
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: '"Roboto", sans-serif' }}>
                Bem-vindo(a) ao VibePlay!
              </h2>
              <p className="text-gray-400 mt-2">
                Encontre suas músicas favoritas, explore novos gêneros e deixe a VibePlay cuidar da sua trilha sonora.
              </p>
            </div>
          )}
          {/* Exibindo os ícones de gênero na tela inicial */}
          {!activeGenre && (
            <div className="grid grid-cols-3 gap-8 mb-8"> {/* Usando grid para melhor organização */}
              <div className="flex flex-col items-center justify-center">
                {/* <FaMusic className="text-6xl text-green-500" />  */}
              </div>
              <div className="flex flex-col items-center justify-center">
                {/* <FaGrinAlt className="text-6xl text-green-500" />  */}
              </div>
              <div className="flex flex-col items-center justify-center">
                {/* <FaSun className="text-6xl text-green-500" />  */}
              </div>
              <div className="flex flex-col items-center justify-center">
                {/* <FaHeadphonesAlt className="text-6xl text-green-500" />  */}
              </div>
              <div className="flex flex-col items-center justify-center">
                {/* <FaDrum className="text-6xl text-green-500" />  */}
              </div>
              <div className="flex flex-col items-center justify-center">
                {/* <FaRegStar className="text-6xl text-green-500" />  */}
              </div>
            </div>
          )}

          {/* Abas para cada gênero */}
          <ul className="tabs flex mb-4 flex-wrap justify-center"> 
            {Object.keys(musicByGenre).map((genre, index) => {
              let genreClass = ''; // Classe para o gênero

              switch (genre) {
                case 'Pop':
                  genreClass = 'genre-pop'; // Define a classe para Pop
                  break;
                case 'Rock':
                  genreClass = 'genre-rock'; // Define a classe para Rock
                  break;
                case 'Eletrônica':
                  genreClass = 'genre-eletronica'; // Define a classe para Eletrônica
                  break;
                case 'Samba/Pagode':
                  genreClass = 'genre-samba'; 
                  break;
                case 'Forró':
                  genreClass = 'genre-forro'; // Define a classe para Forró
                  break;
                case 'Sertanejo':
                  genreClass = 'genre-sertanejo'; // Define a classe para Sertanejo
                  break;
                case 'Rap':
                  genreClass = 'genre-rap'; // Define a classe para Rap
                  break;
                case 'Revoada':
                  genreClass = 'genre-revoada'; // Define a classe para Revoada
                  break;
                default:
                  genreClass = ''; 
              }
              return (
                <li
                  key={genre}
                  className={`px-4 py-2 rounded-t-lg cursor-pointer  ${activeGenre === genre ? 'bg-gray-800' : 'bg-gray-900'}  ${activeGenre === genre ? 'border-b-4 border-green-500' : ''} `}
                onClick={() => {
                setActiveGenre(genre);
                handleGenreClick(); 
              }}
              >
                  {/* Dividir em pares */}
                  <div className={`flex items-center justify-center ${index % 2 === 0 ? 'mr-8' : ''} `}> 
                    <span className={`text-lg font-medium ${genreClass}`}> {genre}</span> 
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Conteúdo da aba ativa */}
          {activeGenre && musicByGenre[activeGenre] && ( // Adicione essas condições
          <div className="music-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {musicByGenre[activeGenre].map((music) => (
                <div
                  key={music.id}
                  className="music-card relative p-6 border border-gray-700 rounded-lg cursor-pointer transition-transform transform hover:scale-105 flex flex-col justify-between"
                  onClick={() => handleMusicClick(music.id)}
                >
                  <div className="relative w-full h-48 rounded-lg overflow-hidden">
                    {/* <Image
                      src={music.image}
                      alt={music.name}
                      layout="fill" 
                      className="object-cover" 
                    /> */}
                    <Image
                      src={music.image}
                      alt={music.name}
                      width={200} 
                      height={200}
                      className="object-cover"
                    /> 
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold mt-4">{music.name}</h2> 
                  <p
                    className={`text-gray-400 mt-1 cursor-pointer ${
                      highlightedArtist === music.artist ? 'text-green-500 font-bold' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArtistClick(music.artist);
                    }}
                  >
                    {music.artist}
                  </p>
                  <p className="text-gray-500 mt-1 h-12 overflow-hidden">{music.description}</p>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center space-x-3">
                      <FaBackward title="Retroceder" className="cursor-pointer" onClick={handleBackward} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMusicClick(music.id);
                        }}
                        className={`p-3 rounded-full text-white focus:outline-none transition-colors duration-300 ${
                          selectedMusic === music.id && isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {selectedMusic === music.id && isPlaying ? <FaPause /> : <FaPlay />}
                      </button>
                      <FaForward title="Avançar" className="cursor-pointer" onClick={handleForward} />
                    </div>
                    <div className="flex items-center space-x-3">
                      {isMuted ? (
                        <FaVolumeMute title="Desmutar" className="cursor-pointer" onClick={toggleMute} />
                      ) : (
                        <FaVolumeUp title="Mutar" className="cursor-pointer" onClick={toggleMute} />
                      )}
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volumeLevels[music.id] ?? 1}
                        onInput={(e) => handleVolumeChange(music.id, e)} 
                        title="Ajustar Volume"
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-3/4 md:w-1/2">
            <h2 style={{ fontFamily: '"Roboto", sans-serif', fontSize: '2xl', fontWeight: 'bold' }}>{currentArtist}</h2> 
            {currentArtist === "Projota" && (
              <p className="text-gray-300">Celebrando 20 anos de carreira em 2022, Projota tem 14 músicas entre as 10 mais tocadas nas rádios brasileiras, bem como dois singles de diamante duplo, 5 singles diamante, nove singles de ouro, um single de platina triplo, quatro singles de platina duplo e três singles de platina em quatro álbuns lançados. No Spotify, soma mais 2 milhões de ouvintes mensais e mais de 1,1 bilhão de streamings.</p>
            )}
            {currentArtist === "Diogo Nogueira" && (
              <p className="text-gray-300">Cantor e compositor, Diogo Nogueira é um dos principais nomes do samba. Filho do saudoso João Nogueira, Diogo carrega a música em seu sangue e se apresenta como um sambista nato. Em seus 14 anos de carreira, já conquistou 2 Grammys Latinos, 1 VMB MTV Brasil, 6 discos de ouro, 3 DVDs de ouro, 2 DVDs de platina e 1 DVD de platina duplo.</p>
            )}
            {currentArtist === "Skank" && (
              <p className="text-gray-300">Banda de pop/rock/reggae formada em 1991, Skank teve uma turnê de despedida em 2022, encerrando uma carreira de mais de 30 anos. Com muitos hits conhecidos, a banda é um ícone da música brasileira.</p>
            )}
            {currentArtist === "Alok" && (
              <p className="text-gray-300">ALOK é um DJ brasileiro de música eletrônica, conhecido mundialmente por suas produções e colaborações. Ele ganhou notoriedade com hits que alcançaram o topo das paradas musicais e se tornou um dos DJs mais influentes do mundo. Em 2023, foi nomeado o DJ número 1 na América Latina pela terceira vez consecutiva, consolidando sua posição no cenário global da música eletrônica.</p>
            )}
            {currentArtist === "Capital Inicial" && (
              <p className="text-gray-300">Capital Inicial é uma banda de rock brasileira formada em Brasília, Distrito Federal, em 1982, depois que o grupo Aborto Elétrico encerrou as atividades, dando início também à banda Legião Urbana. A banda é composta pelo vocalista Dinho Ouro Preto, o baixista Flávio Lemos, seu irmão e baterista Fê Lemos, o guitarrista Yves Passarell e pelos músicos de apoio Nei Medeiros (teclado e violões) e Fabiano Carelli (guitarra e violão).</p>
            )}
            {currentArtist === "Cyndi Lauper" && (
              <p className="text-gray-300">Cyndi Lauper é uma compositora e artista performática inovadora, vencedora de prêmios Grammy, Emmy e Tony, com vendas globais de discos superiores a 50 milhões. Sua voz icônica, glamour punk influente e shows ao vivo contagiosos a catapultaram ao estrelato. Lauper ganhou o prêmio Grammy de Melhor Artista Revelação com seu primeiro álbum, She's So Unusual, e se tornou a primeira mulher na história a ter quatro singles entre os cinco primeiros de um álbum de estreia. Desde então, Lauper lançou dez álbuns de estúdio adicionais, gerando clássicos atemporais como “Time After Time” e “True Colors”, além do hino “Girls Just Wanna Have Fun.” Ela foi indicada a 15 prêmios Grammy, dois American Music Awards, sete American Video Awards e 18 MTV Awards.</p>
            )}
            {currentArtist === "Madonna" && (
              <p className="text-gray-300">Madonna mudou a trajetória da música popular não muito depois de "Borderline" se tornar seu primeiro sucesso entre os dez melhores em 1984. Fusão de dança pós-disco com pop efervescente, a canção era inesperada e fresca, um truque que logo se tornou sua marca registrada. Ao longo de uma carreira que durou décadas, Madonna trouxe sons underground para o mainstream, especializando-se em tendências que borbulhavam nas casas noturnas. Ao chegar no início da era MTV, ela aproveitou as possibilidades dos videoclipes, criando uma série de clipes sexy e estilosos que lhe renderam a reputação de provocadora, ao mesmo tempo em que estabeleceu a rede como o bastião da cultura descolada nos anos 1980.</p>
            )}
            {currentArtist === "Los Hermanos" && (
              <p className="text-gray-300">Los Hermanos é uma banda brasileira formada em 1997, conhecida por sua mistura de rock, MPB e influências de samba. O grupo é famoso por suas letras poéticas e melodias cativantes, conquistando fãs com hits como "Anna Júlia" e "O Vencedor."</p>
            )}
            {currentArtist === "Wesley Safadão" && (
              <p className="text-gray-300">A banda Wesley Safadão & Garota Safada surgiu como uma brincadeira. O grupo começou com o intuito de divertir familiares e amigos. Misturando o ritmo animado do forró com uma musicalidade mais lenta (pra dançar agarradinho!) as coisas foram dando certo e hoje Wesley Safadão é um dos mais conceituados artistas do forró no país. Em 2015, Wesley lançou o projeto solo Ao Vivo Em Brasilia. Em 2016 foi a vez do Duetos(Ao Vivo), que reuniu grandes nomes da música nacional, e do trabalho intimista WS . E em 2017 lança o seu WS , gravado na Flórida. O projeto chegou diretamente dos Estados Unidos, trazendo o calor do verão de Miami para aquecer o inverno brasileiro. Wesley inovou no repertório e no visual, de cabelo curto. Seu último álbum,Ws Mais uma vez , foi lançado em setembro de 2018 e está contando com o grande sucesso de "Só Pra Castigar".</p>
            )}
            {currentArtist === "NATTAN" && (
              <p className="text-gray-300">Sou o inventor de um mundo fantástico que você está convidado a conhecer. Natanael Cesário dos Santos, mas você, que já é meu chegado, pode me chamar de Nattan.

              Tô na estrada desde os 15 anos de idade e, macho, de lá pra cá já foi tanto Cabaré, que PQP, essa é uma história Diferente das Diferentes mesmo!!</p>
            )}
            {currentArtist === "Felipe Amorim" && (
              <p className="text-gray-300">Felipe Amorim é natural da cidade de Fortaleza e coleciona diversos hits. O artista soma quase 2 bilhões e meio de streams nas plataformas digitais e emplacou sucessos como "No Ouvidinho" e "Putariazinha". Os hits de Felipe Amorim já chegaram a quase 1 milhão de vídeos produzidos para as redes de vídeos curtos e seus shows reúnem multidões. Seu último projeto é o EP "Ao After e Além Pt II, "composto e produzido junto a seus parceiros Kaleb Capitão e Caio Djay, trazendo 10 faixas. Nosso destino é o seu after, a normalidade se tornará uma lembrança, e o surreal será o novo normal. Perguntamos: “Um after na lua? Por que não?” O EP “Ao After e Além Pt II” promete elevar sua experiência, garantindo que o único limite seja a nossa imaginação coletiva. Compositor de sucesso, Felipe foi responsável por “Tá Rocheda”, a música que levou o Barões da Pisadinha ao estrelato. Grandes nomes da música nacional como Wesley Safadão, Xand Avião, Claudia Leitte, Mano Walter e Zé Vaqueiro já fizeram sucesso com composições marcantes de Felipe. Com a carreira de compositor consolidada, Felipe decidiu estrear como cantor e já desponta como a grande sensação da pisadinha.</p>
            )}
            {currentArtist === "Manu Bahtidão" && (
              <p className="text-gray-300">Manu Bahtidão iniciou sua carreira aos 14 anos em uma banda de forró em Juazeiro do Norte (CE). Em 2007 fez parte da Banda da Loirinha, passou pela Companhia do Calypso e em 2009, em Belém do Pará, deu vida à Banda Batidão, apostando no tecnomelody.

              Manu estourou por todo o norte e nordeste com seus sucessos: Como Num Filme, Lembrei de Você, Apaixonada, Voltar Ao Passado, Guerra de Amor. Teve seus sucessos regravados por diversos artistas, inclusive, por Pabllo Vittar em seu álbum Batidão Tropical (2021,Apaixonada).
              
              Em 2015 decideu seguir carreira solo e apostar na sua carreira no sertanejo. Lançou um EP e o single "Não Tem Essa Que Não Chora" com participação de Simone Mendes, garantindo +24 milhões de streams. Em 2018 lançou o DVD Século XXI, com participações de Márcia Fellipe,Naiara Azevedo, Lucas Lucco  e mais artistas.</p>
            )}
            {currentArtist === "Ana Castela" && (
              <p className="text-gray-300">Ana Castela, também conhecida como Boiadeira, atualmente é uma das principais cantoras do Brasil. Com milhões de seguidores em suas redes sociais, ocupa os topos das principais plataformas digitais do país, acumulando bilhões de streams e reproduções em suas músicas, que se tornaram grandes hits, como “Pipoco”, “Boiadeira”, “Nosso Quadro”, “Solteiro Forçado” e muito mais, incluindo feats de sucesso com grandes artistas.</p>
            )}
            {currentArtist === "Jota Quest" && (
              <p className="text-gray-300">Jota Quest - Banda brasileira formada nos anos 90 na efervescente cena pop-rock de Belo Horizonte, capital de Minas Gerais. Lançaram, em 1995, o álbum independente “J.Quest” que seria seu passaporte para o primeiro contrato com a Sony Music, gravadora com quem construiriam sua carreira discográfica que totaliza hoje: 10 álbuns de estúdio, 5 registros "Ao Vivo", 1 álbum "Latino" e um audiovisual “Acústico", além de inúmeros singles, videoclipes, docs e coletâneas que somadas ultrapassam 7 milhões de unidades físicas vendidas, e acabam de alcançar a marca de 1B de views, plays e downloads.</p>
            )}
            {currentArtist === "Ed Sheeran" && (
              <p className="text-gray-300">O cantor pop idiossincrático Ed Sheeran incorpora estilos diversos em sua música, moldando gêneros para criar um caráter musical único que é encantador, acessível e popular em todo o mundo. Elementos de folk, hip-hop, pop, dance, soul e rock podem ser ouvidos em seus grandes sucessos, como "The A Team", "Sing", "Thinking Out Loud" e "Shape of You", o que lhe confere uma ampla atratividade entre diferentes demografias.</p>
            )}
            {currentArtist === "Legião Urbana" && (
              <p className="text-gray-300">A Legião Urbana foi formada a partir da frustração juvenil na capital do Brasil, Brasília, durante a crise econômica e a corrupção dos anos 80. A melhor forma de lidar com esse cenário foi o punk rock, o veículo inicial adotado por Renato Russo em sua banda Aborto Elétrico, que daria origem à Legião Urbana. Com as letras incandescentes de Russo, que retratam as frustrações de uma geração perdida em um estilo pop/rock, a Legião Urbana deu voz a uma multitude de pessoas desesperadas, tornando-se um fenômeno de popularidade em todo o Brasil.</p>
            )}
            {currentArtist === "Ferrugem" && (
              <p className="text-gray-300">Ferrugem nem sempre foi chamado assim. Nascido no Rio de Janeiro, o cantor, compositor e empresário, tem em sua certidão de nascimento o nome de Jheison Failde de Souza. O apelido foi dado por um amigo ao vê-lo entrando em um estúdio de gravação. O motivo? Suas sardas no rosto. E o apelido pegou! O cantor, que já foi até vendedor de jornal, é hoje um dos maiores nomes do samba & pagode do país, um dos artistas masculinos com mais ouvintes mensais no Spotify Brasil, com turnês em todo país, turnês internacionais e o primeiro artista do gênero a compor o line up de um dos maiores festivais de música do mundo: o Rock in Rio 2022, como embaixador do Palco Favela.</p>
            )}
            {currentArtist === "Raça Negra" && (
              <p className="text-gray-300">Há quase 40 anos, a banda Raça Negra formada em São Paulo, em 1983, foi pioneira no segmento do samba romântico. Responsável pela popularização do gênero nos meios de comunicação, o Raça Negra emplacou um hit atrás do outro e até hoje segue atraindo público e mídia. Em 1990 a banda emplacou inúmeros sucessos como “Cigana”, “Doce Paixão”, “Cheia de Manias”, entre outros, e deu início a era do samba paulista.</p>
            )}
            {currentArtist === "Tribo da Periferia" && (
              <p className="text-gray-300">O Tribo da Periferia nasceu nas raízes do Distrito Federal, em 1998, quando Luiz Fernando Correia da Silva, mais conhecido como Duckjay, decidiu dar o primeiro passo para esse sonho, compondo sua primeira letra musical. Desde então, a Tribo foi tomando novas formas e ganhando novos protagonistas, como Look (Nelcivando Lustosa Rodrigues), que desde 2016 segue ao lado de Duckjay conectando cada vez mais pessoas.</p>
            )}
            {currentArtist === "Hungria" && (
              <p className="text-gray-300">Nascido em Brasília-DF no dia 26 de maio de 1991, Hungria começou a compor aos 8 anos de idade e aos 14 lançava "Hoje ta embaçado", que em pouco tempo contabilizou 120 mil visualizações. Animado com o sucesso, Gustavo da Hungria Neves decidiu que precisava de um nome artístico, e aí adotou seu sobrenome - Hungria.</p>
            )}
            {currentArtist === "Marcos & Belutti" && (
              <p className="text-gray-300">Com mais de 15 anos de carreira, Marcos e Belutti colecionam projetos incríveis; prêmios e indicações importantes na categoria; hits inesquecíveis como “Domingo de Manhã” e “Aquele 1%”. Na bagagem, são 6 DVD’s, 9 CD’s, 1 álbum digital e muitas parcerias de sucesso. Os números que a dupla acumula ao longo dos últimos anos impressiona: são cerca de 1 bilhão e meio de visualizações em seus vídeos, mais de 14 milhões de seguidores nas redes sociais, 6 milhões de fãs nas plataformas digitais e aproximadamente 10 milhões de ouvintes mensais nos aplicativos de música.</p>
            )}
            {currentArtist === "Calcinha Preta" && (
              <p className="text-gray-300">“A Banda de Forró Mais Gostosa do Brasil” já tem 28 anos de estrada e teve seu nome inspirado na coleção de calcinhas pretas do ex-empresário. Natural de Sergipe, a banda se tornou conhecida pela qualidade de seus espetáculos que impressionam o público com luzes e efeitos especiais de última geração, bem como pelas canções, figurinos e coreografias que ganharam o gosto popular, rompendo as barreiras regionais e disseminando o Forró Eletrônico da Banda para todo país.</p>
            )}
            {currentArtist === "Cyndi Lauper" && (
              <p className="text-gray-300">Cyndi Lauper é uma compositora e artista performática inovadora, vencedora de prêmios Grammy, Emmy e Tony, com vendas globais de mais de 50 milhões de discos. Sua voz icônica, glamour punk influente e shows ao vivo contagiosos a catapultaram à fama. Lauper ganhou o Grammy de Melhor Artista Revelação com seu primeiro álbum, She's So Unusual, e se tornou a primeira mulher na história a ter quatro singles no top cinco de um álbum de estreia. Desde então, lançou dez álbuns de estúdio adicionais, trazendo clássicos atemporais como “Time After Time” e “True Colors”, além do hino “Girls Just Wanna Have Fun”. Ela recebeu 15 indicações ao Grammy, duas ao American Music Awards, sete ao American Video Awards e 18 ao MTV Awards.</p>
            )}
            {currentArtist === "Iguinho e Lulinha" && (
              <p className="text-gray-300">Nascer em um pequeno município no interior do sertão Sergipano não impediu que Iguinho e Lulinha sonhassem com o sucesso e hoje, são a primeira dupla de cantores de piseiro do Brasil!

              Naturais de Canindé de São Francisco, SE, os irmãos tiveram as primeiras experiências artísticas ao lado do avó Zé Leobino, conhecido vaqueiro nacional e figura folclórica da região onde viviam.  A família sempre esteve muito presente na vida dos meninos. Na companhia do pai e tio, eles iam em cavalgadas, vaquejadas e até mesmo a programas de rádio e televisão local.</p>
            )}
            {currentArtist === "Matheus Fernandes" && (
              <p className="text-gray-300">Ele viu sua carreira decolar aos 23 anos de idade após o estouro de músicas como "Mulherada Na Lancha", "Mete Ficha" e "Modo Avião". Hoje, aos 31 anos e com quase uma década de estrada, Matheus Fernandes é um dos grandes nomes do forró brasileiro, combinando ritmos como piseiro, sertanejo e batidas eletrônicas. Seu repertório contém mais de 50 músicas autorais e ostenta suas letras cantadas nas vozes de grandes nomes da música brasileira como Jorge e Mateus, Wesley Safadão, Xand Avião, Cristiano Araújo, Humberto e Ronaldo, entre outros.</p>
            )}
            {currentArtist === "Mamonas Assassinas" && (
              <p className="text-gray-300">Mamonas Assassinas foi uma banda brasileira formada em Guarulhos em 1989, conhecida por seu estilo de rock cômico que misturava rock and roll com sátiras e humor. A banda começou como Utopia e alcançou grande sucesso em 1995 com seu álbum autointitulado, que vendeu mais de 1,8 milhão de cópias, ganhando disco de diamante. Eles eram famosos por suas letras irreverentes e performances enérgicas, com hits como "Vira-Vira," "Pelados em Santos" e "Robocop Gay"</p>
            )}
            <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded" onClick={handleCloseModal}>
              Fechar
            </button>
          </div>
        </div>
      )}

      <footer className="bg-gray-900 text-white py-2 text-center">
        <div className="max-w-screen-lg mx-auto px-4">
          <p className="text-sm mb-2">© {new Date().getFullYear()} Desenvolvido por Ângelo Silvano</p>
          <div className="flex justify-center space-x-4">
            <a
              href="https://github.com/angelodesenvolvedor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-gray-400 hover:text-gray-300 transition-colors duration-300"
            >
              <FaGithub className="mr-1" /> GitHub
            </a>
            <a
              href="https://linkedin.com/in/angelosilvanno"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-gray-400 hover:text-gray-300 transition-colors duration-300"
            >
              <FaLinkedin className="mr-1" /> LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 
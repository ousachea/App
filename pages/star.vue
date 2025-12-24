<template>
    <div class="container">
        <header class="header">
            <h1>Works Tracker</h1>
            <p class="subtitle">63 Artists • 484 Unique Works</p>
        </header>

        <div class="controls">
            <div class="search-box">
                <input v-model="searchQuery" type="text" placeholder="Search artists or works..."
                    class="search-input" />
            </div>

            <div class="filters">
                <select v-model="sortBy" class="select">
                    <option value="name">Sort by Name</option>
                    <option value="works-count">Sort by Works Count</option>
                    <option value="name-reverse">Name (Z-A)</option>
                </select>

                <input v-model.number="minWorks" type="number" placeholder="Min works" class="number-input" />
            </div>
        </div>

        <div class="stats">
            <div class="stat">
                <span class="stat-label">Total Artists:</span>
                <span class="stat-value">{{ filteredArtists.length }}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Total Works:</span>
                <span class="stat-value">{{ totalFilteredWorks }}</span>
            </div>
        </div>

        <div class="artists-grid">
            <div v-for="artist in filteredAndSortedArtists" :key="artist.name" class="artist-card"
                @click="selectArtist(artist)">
                <div class="artist-cover-wrapper">
                    <img :src="getPlCoverUrl(artist.mainWorks[0])" :alt="artist.name" class="artist-cover"
                        @error="handleImageError" @load="handleImageLoad" />
                    <div class="image-placeholder">
                        <div class="placeholder-content">
                            <span class="placeholder-code">{{ artist.mainWorks[0] }}</span>
                        </div>
                    </div>
                    <div class="artist-overlay">
                        <div class="artist-info">
                            <h2 class="artist-name">{{ artist.name }}</h2>
                            <span class="works-count">{{ artist.mainWorks.length }} works</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="filteredAndSortedArtists.length === 0" class="no-results">
            <p>No artists found matching your criteria.</p>
        </div>

        <!-- Artist Works Modal -->
        <transition name="fade">
            <div v-if="selectedArtist" class="modal-overlay" @click="selectedArtist = null">
                <div class="modal-content" @click.stop>
                    <button class="modal-close" @click="selectedArtist = null">✕</button>

                    <div class="modal-header">
                        <h2>{{ selectedArtist.name }}</h2>
                        <p class="modal-subtitle">{{ selectedArtist.mainWorks.length }} works</p>
                    </div>

                    <div class="modal-body">
                        <div class="works-grid">
                            <div v-for="(work, index) in selectedArtist.mainWorks" :key="index" class="work-card"
                                @click="selectWork(work)">
                                <div class="work-cover">
                                    <img :src="getPlCoverUrl(work)" :alt="work" class="work-image"
                                        @error="handleImageError" @load="handleImageLoad" />
                                    <div class="image-placeholder">
                                        <div class="placeholder-content">
                                            <span class="placeholder-code">{{ work }}</span>
                                        </div>
                                    </div>
                                    <div class="work-overlay">
                                        <span class="view-label">View</span>
                                    </div>
                                </div>
                                <span class="work-code">{{ work }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Work Detail Modal -->
        <transition name="fade">
            <div v-if="selectedWork" class="modal-overlay" @click="selectedWork = null">
                <div class="detail-modal-content" @click.stop>
                    <button class="modal-close" @click="selectedWork = null">✕</button>

                    <div class="detail-modal-header">
                        <h2>{{ selectedWork }}</h2>
                    </div>

                    <div class="detail-modal-body">
                        <div class="cover-section">
                            <div class="cover-container">
                                <img :src="getPlCoverUrl(selectedWork)" :alt="selectedWork" class="detail-cover"
                                    @error="handleImageError" @load="handleImageLoad" />
                                <div class="image-placeholder">
                                    <div class="placeholder-content">
                                        <span class="placeholder-code">{{ selectedWork }}</span>
                                        <span class="placeholder-label">Detailed Cover</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="preview-section">
                            <h3 class="preview-title">Preview Gallery (20 images)</h3>
                            <div class="preview-grid">
                                <div v-for="num in 20" :key="num" class="preview-item">
                                    <img :src="getPreviewUrl(selectedWork, num)" :alt="`Preview ${num}`"
                                        class="preview-image" @error="handleImageError" @load="handleImageLoad"
                                        loading="lazy" />
                                    <div class="image-placeholder" style="display: none;">
                                        <span class="placeholder-code" style="font-size: 9px;">{{ num }}</span>
                                    </div>
                                    <span class="preview-num">{{ num }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
const DEFAULT_ARTISTS = [
    { name: 'Ai Kano', mainWorks: ['JUQ-106', 'JUQ-763', 'JUQ-963'] },
    { name: 'Ai Sayama', mainWorks: ['JUFE-090', 'JUFE-101', 'JUY-717', 'MEYD-414', 'MEYD-576', 'MEYD-652', 'MEYD-978', 'PPPD-394', 'PPPD-603', 'WAAA-403'] },
    { name: 'Aika Yumeno', mainWorks: ['SNIS-413', 'SNIS-477', 'SNIS-659', 'SONE-874', 'SSNI-304'] },
    { name: 'Aiko Kimura', mainWorks: ['SONE-828', 'SONE-866'] },
    { name: 'Airi Hinata', mainWorks: ['NITR-223'] },
    { name: 'Anna Morikawa', mainWorks: ['PRED-018'] },
    { name: 'Anzai Rara', mainWorks: ['SSIS-025', 'SSIS-050', 'SSIS-103', 'SSIS-124', 'SSIS-136', 'SSIS-172', 'SSIS-203', 'SSIS-232', 'SSIS-262', 'SSIS-269', 'SSIS-357', 'SSNI-643', 'SSNI-671', 'SSNI-700', 'SSNI-727', 'SSNI-752', 'SSNI-777', 'SSNI-799', 'SSNI-822'] },
    { name: 'Aoi', mainWorks: ['SNIS-977'] },
    { name: 'Asahi Mizuno', mainWorks: ['JUL-442', 'JUL-546', 'NITR-114'] },
    { name: 'Asuna Kawai', mainWorks: ['ABF-119', 'ABF-268', 'ABF-278', 'ABW-268', 'PPT-128'] },
    { name: 'Collection', mainWorks: ['259LUXU-1511', '259LUXU-1518', '259LUXU-1571', '259LUXU-1610', '259LUXU-1618', '259LUXU-1621', '259LUXU-1631', '259LUXU-688', '259LUXU-743', 'ADN-630', 'ARA-412', 'CLUB-855', 'DDHP-044', 'FC2-PPV-2864495', 'FLC-004', 'GANA-1026', 'GANA-1996', 'GANA-2100', 'GANA-2156', 'GANA-2705', 'GANA-2858', 'GERK-350', 'GES-038', 'HAWA-287', 'HMT-018', 'IND-022', 'IND-063', 'ION-162', 'JAC-175', 'JUFE-028', 'JUL-872', 'KTB-018', 'MIUM-681', 'MIUM-742', 'MIUM-811', 'MIUM-865', 'MIUM-908', 'NTK-391', 'ORECS-132', 'SSNI-362', 'SUKE-043', 'SUKE-053', 'TOUKA-01', 'VEC-340', 'VGD-192', 'XVSR-487'] },
    { name: 'Ema Yuina', mainWorks: ['ABP-433', 'ABP-447', 'ABP-460', 'ABP-471', 'ABP-484', 'BGN-031', 'CHN-096'] },
    { name: 'Hana Himesaki', mainWorks: ['348NTR-024', 'ABP-892', 'ABP-943', 'ABP-971', 'ABW-019', 'ABW-256', 'CEMD-090', 'CEAD-475', 'FPRE-199', 'JUFE-264', 'KAM-213', 'LULU-076', 'MIAA-392', 'MXGS-1306', 'NSFS-012', '300MIUM-720'] },
    { name: 'Haruka Riri', mainWorks: ['CKCK-020', 'EBWH-138', 'EBWH-191'] },
    { name: 'Haruna Hana', mainWorks: ['JUFD-867', 'PKPT-015', 'TOEN-020', 'UFE-084', 'VRTM-446'] },
    { name: 'Hikari Ogura', mainWorks: ['EBWH-222', 'EBWH-258', 'EBWH-264', 'EBWH-289'] },
    { name: 'Hikari Sena', mainWorks: ['AVSA-171', 'BANK-013', 'BNST-023', 'HOMA-108', 'JUFE-279', 'MIAA-395', 'PFES-002', 'SAN-019', 'URKK-035', 'WAAA-043'] },
    { name: 'Hitomi Tanaka', mainWorks: ['ATID-192', 'DASD-132', 'MDYD-895', 'MDYD-940', 'MDYD-971', 'MIDE-184', 'MIDD-933', 'MIMK-007', 'PPPD-441', 'PPPD-618', 'PPPD-628', 'PPPD-663', 'PPPD-671', 'PPPD-703', 'PPPD-752', 'PPPD-818', 'PPPD-824', 'PPPD-835', 'PPPD-867', 'PPPD-881', 'PPPD-996'] },
    { name: 'Hoshino Nami', mainWorks: ['SNIS-373', 'SNIS-462'] },
    { name: 'JULIA', mainWorks: ['MDYD-751', 'PRED-293', 'WANZ-808'] },
    { name: 'Kana Kusakabe', mainWorks: ['HMN-519'] },
    { name: 'Kanno Sayuki', mainWorks: ['GVG-122'] },
    { name: 'Kanon Hinano', mainWorks: ['DLDSS-361', 'DLDSS-362', 'DLDSS-372', 'FWAY-086', 'IPZZ-736'] },
    { name: 'Kiritani Matsuri', mainWorks: ['MEYD-624'] },
    { name: 'Kiyohara Miyuu', mainWorks: ['SNOS-040', 'SONE-115', 'SONE-142', 'SONE-342', 'SONE-387', 'SONE-798'] },
    { name: 'Koibuchi Momona', mainWorks: ['STARS-712', 'START-042', 'START-165', 'START-231'] },
    { name: 'Koume Ena', mainWorks: ['CLUB-893', 'JUFE-131', 'KAM-196', 'MADV-609', 'MIMK-137'] },
    { name: 'Kokona Asakura (朝倉ここな)', mainWorks: ['CEMD-113', 'MEYD-696', 'BKYN-005', 'HMN-051', '230ORECO-734'] },
    { name: 'Marina Shiraishi', mainWorks: ['JUQ-941', 'JUL-225', 'STAR-830'] },
    { name: 'Mary Tachibana', mainWorks: ['NKKD-322', 'ROYD-175'] },
    { name: 'Meguri', mainWorks: ['JUR-531', 'JUQ-943', 'PPPD-329'] },
    { name: 'Mei Washio', mainWorks: ['SSIS-383', 'SSIS-558', 'SSIS-585'] },
    { name: 'Mihara Honoka', mainWorks: ['FC2PPV-1178399', 'HUNTA-430', 'NHDTB-249'] },
    { name: 'Miina Wakatsuki', mainWorks: ['AP-444', 'CLUB-669', 'GVH-222', 'HUNTA-314', 'HUNTA-348', 'KATU-080', 'NGOD-113', 'NITR-202', 'SW-560', 'SW-621', 'NITR-209', 'FC2-PPV-1046522'] },
    { name: 'Mina Fukuhara', mainWorks: ['CLUB-881'] },
    { name: 'Minato Haru', mainWorks: ['FC2PPV-3087371', 'FC2PPV-3104502', 'FC2PPV-4203485', 'FWAY-002', 'FWAY-060', 'JDKR-032', 'MIRD-259', 'OFES-013', 'SNOS-001', 'SONE-021', 'SONE-063', 'SONE-155', 'SONE-188', 'SONE-503', 'SONE-508', 'SONE-776', 'SONE-865', 'SONE-914', 'SONE-978', 'SSIS-889', 'SSIS-890', 'SSIS-945', 'SSIS-978', 'TZ-124'] },
    { name: 'Mio Kimijima', mainWorks: ['HND-511', 'HND-547', 'IQQQ-024', 'IPX-083', 'JUY-543', 'JUY-606', 'MIAE-226', 'NIMA-007', 'NITR-388', 'PPPD-686', 'URPW-039'] },
    { name: 'Mitsuki Momota', mainWorks: ['MIDA-026', 'MIDA-064', 'MIDA-102', 'MIDA-139', 'MIDA-190', 'MIDA-214', 'MIDA-258', 'MIDA-305', 'MIDA-346', 'MIDA-385', 'MIDA-424', 'MIDV-569', 'MIDV-574', 'MIDV-577', 'MIDV-637', 'MIDV-668', 'MIDV-698', 'MIDV-769', 'MIDV-804', 'MIDV-831', 'MIDV-869', 'MIDV-905', 'MIDV-985', 'MDVR-288', 'MDVR-317', 'MDVR-325', 'NAAC-032', 'OAE-253', 'REBD-854', 'FWAY-047'] },
    { name: 'Miu Shiramine', mainWorks: ['ADN-499', 'ADN-738', 'ATID-641', 'IPX-736', 'IPX-845', 'PRED-533', 'PRED-685'] },
    { name: 'Moa Maeda', mainWorks: ['ADN-334', 'HND-991', 'JUFE-300', 'MIMK-091', 'MSFH-010', 'MSFH-014', 'MSFH-018', 'MSFH-024', 'MSFH-030', 'MSFH-034', 'PPPD-926', 'WAAA-065'] },
    { name: 'Momoka Nishina', mainWorks: ['JUFD-183', 'JUC-579', 'PYU-069', 'SVDVD-278'] },
    { name: 'Nagarekawa Rio', mainWorks: ['300MIUM-892'] },
    { name: 'Nagi Hikaru', mainWorks: ['SONE-385', 'SONE-290', 'SSIS-817'] },
    { name: 'Nana Fukada', mainWorks: ['EBOD-578'] },
    { name: 'Nanami Matsumoto', mainWorks: ['JUY-858', 'OFES-009', 'SSNI-110'] },
    { name: 'Rei Kamiki', mainWorks: ['START-070', 'START-398', 'STARS-734'] },
    { name: 'Ren Gojou', mainWorks: ['MIMK-263', 'SONE-394', 'SONE-486', 'SONE-532', 'SONE-748', 'SONE-837', 'SONE-888'] },
    { name: 'Rion Hiiragi', mainWorks: ['259LUXU-1840'] },
    { name: 'Saegusa Chitose', mainWorks: ['JUFD-430', 'NGOD-150', 'WAAA-026'] },
    { name: 'Ruri Saijo', mainWorks: ['ATOM-150', 'IENE-596', 'IESP-605', 'JUFD-407', 'JUFD-502', 'NITR-056', 'PPPD-413', 'TYOD-255', 'VEC-094', 'VEC-135', 'WANZ-103'] },
    { name: 'Saeko Matsushita', mainWorks: ['SHKD-713', 'MBYD-289', 'IPX-461'] },
    { name: 'Sakura Kirishima', mainWorks: ['AP-363', 'DVAJ-360', 'EKDV-514', 'FSET-797', 'MAXVR-7', 'MDBK-260', 'MKMP-001', 'REAL-679', 'UMMA-001', 'URPW-013', 'VOSS-094'] },
    { name: 'Sakura Nene', mainWorks: ['DASD-406', 'HEYZO-3675', 'NITR-367', 'TEM-066'] },
    { name: 'Satomi Hibino', mainWorks: ['BF-475'] },
    { name: 'Satomi Mioka', mainWorks: ['230ORECO-189', '300MIUM-865', '300MIUM-908', '483DAM-016', 'APNS-293', 'HAWA-325', 'HUNTB-733', 'MAAN-955', 'RECS-283', 'SAN-406', 'BARE-009', 'SRTD-349', 'SRTD-345', 'SPAY-241', 'SIRO-4820', 'LUXU-1572', 'ZOZO-165', 'APAA-387', 'GVH-477', 'MRPA-006', 'PKPD-217', 'UZU-004', 'SUN-071', 'MIUM-862', 'NHMSG-031', 'ORECO-079', 'MAAN-982', 'MAAN-836', 'BDST-027', 'AKDL-247', 'AKDL-213', 'AKDL-193', 'DFDM-041'] },
    { name: 'Sena Kasumi', mainWorks: ['200GANA-2156', '483PAK-006', 'STCV-240', 'SUKE-062', 'MIUM-495', 'STCV-232', 'PAK-006', 'BONY-007', 'KTKC-074', 'NNPJ-514', 'NDH-017', 'MFC-169', 'MIUM-801', 'NTK-637', 'MFC-117', 'MAAN-842', 'MAAN-632', 'SIRO-3954'] },
    { name: 'Shio Asami', mainWorks: ['DLDSS-406', 'DLDSS-402', 'DLDSS-381', 'DLDSS-343', 'DLDSS-342'] },
    { name: 'Sunao Kokonoi', mainWorks: ['REAL-958'] },
    { name: 'Touka Rinne', mainWorks: ['JUY-603', 'JUY-984', 'KTB-303', 'MVSD-383', 'PPPD-715', 'PPPD-754', 'MAAN-387'] },
    { name: 'Umika Minamizawa', mainWorks: ['SNOS-009', 'SONE-590'] },
    { name: 'Utsunomiya Shion', mainWorks: ['AVOP-004', 'SNIS-009', 'SNIS-027', 'SNIS-048', 'SNIS-070', 'SNIS-091', 'SNIS-110', 'SNIS-129', 'SNIS-147', 'SNIS-166', 'SNIS-205', 'SOE-992'] },
    { name: 'Yoshine Yuria', mainWorks: ['JUFE-195', 'MIMK-249', 'NGOD-128'] },
    { name: 'Yui Hatano', mainWorks: ['JJDA-058', 'NGOD-304'] },
    { name: 'Yuri Oshikawa', mainWorks: ['BDA-059', 'JUFE-351', 'LULU-181', 'MILLE-009', 'PPPD-666', 'WANZ-388', 'JUR-126', 'BNST-056', 'ECB-109', 'BSY-022'] }
];

export default {
    data() {
        return {
            artists: DEFAULT_ARTISTS,
            searchQuery: '',
            sortBy: 'name',
            minWorks: 0,
            selectedArtist: null,
            selectedWork: null
        };
    },
    computed: {
        filteredArtists() {
            return this.artists.filter(artist => {
                const query = this.searchQuery.toLowerCase();
                const matchesSearch = !query ||
                    artist.name.toLowerCase().includes(query) ||
                    artist.mainWorks.some(work => work.toLowerCase().includes(query));
                const matchesMinWorks = artist.mainWorks.length >= this.minWorks;
                return matchesSearch && matchesMinWorks;
            });
        },
        filteredAndSortedArtists() {
            const sorted = [...this.filteredArtists];
            if (this.sortBy === 'name') {
                sorted.sort((a, b) => a.name.localeCompare(b.name));
            } else if (this.sortBy === 'works-count') {
                sorted.sort((a, b) => b.mainWorks.length - a.mainWorks.length);
            } else if (this.sortBy === 'name-reverse') {
                sorted.sort((a, b) => b.name.localeCompare(a.name));
            }
            return sorted;
        },
        totalFilteredWorks() {
            return this.filteredArtists.reduce((sum, artist) => sum + artist.mainWorks.length, 0);
        }
    },
    methods: {
        extractDmmId(workCode) {
            // Convert code like "JUQ-106" to "juq0106" format
            // Remove hyphens and convert to lowercase
            const cleaned = workCode.replace(/-/g, '').toLowerCase();

            // Pad numbers to match DMM format
            // e.g., JUQ-106 -> juq0106
            let result = '';
            let i = 0;
            while (i < cleaned.length && isNaN(cleaned[i])) {
                result += cleaned[i];
                i++;
            }

            // Get the numeric part and pad to 4 digits
            const numPart = cleaned.substring(i);
            if (numPart) {
                result += numPart.padStart(4, '0');
            }

            return result;
        },
        getPlCoverUrl(workCode) {
            const dmmId = this.extractDmmId(workCode);
            return `https://pics.dmm.co.jp/digital/video/${dmmId}/${dmmId}pl.jpg`;
        },
        getPreviewUrl(workCode, num) {
            const dmmId = this.extractDmmId(workCode);
            return `https://pics.dmm.co.jp/digital/video/${dmmId}/${dmmId}jp-${num}.jpg`;
        },
        selectArtist(artist) {
            this.selectedArtist = artist;
        },
        selectWork(workCode) {
            this.selectedWork = workCode;
        },
        handleImageError(event) {
            // Show placeholder when image fails to load
            const placeholder = event.target.nextElementSibling;
            if (placeholder && placeholder.classList.contains('image-placeholder')) {
                placeholder.style.display = 'flex';
            }
        },
        handleImageLoad(event) {
            // Hide placeholder when image loads
            const placeholder = event.target.nextElementSibling;
            if (placeholder && placeholder.classList.contains('image-placeholder')) {
                placeholder.style.display = 'none';
            }
        }
    }
};
</script>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #ffffff;
    min-height: 100vh;
}

.header {
    margin-bottom: 30px;
    border-bottom: 1px solid #e5e5e5;
    padding-bottom: 20px;
}

.header h1 {
    font-size: 32px;
    font-weight: 600;
    color: #000;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
}

.subtitle {
    font-size: 14px;
    color: #666;
}

.controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
}

.search-box {
    display: flex;
}

.search-input {
    flex: 1;
    padding: 12px 16px;
    font-size: 16px;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-family: inherit;
    transition: border-color 0.2s;
}

.search-input:focus {
    outline: none;
    border-color: #000;
}

.filters {
    display: flex;
    gap: 12px;
}

.select,
.number-input {
    padding: 10px 12px;
    font-size: 14px;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-family: inherit;
    background: #fff;
    cursor: pointer;
}

.select:focus,
.number-input:focus {
    outline: none;
    border-color: #000;
}

.number-input {
    width: 120px;
}

.stats {
    display: flex;
    gap: 24px;
    margin-bottom: 28px;
    padding: 16px 0;
    border-bottom: 1px solid #e5e5e5;
}

.stat {
    display: flex;
    align-items: center;
    gap: 8px;
}

.stat-label {
    font-size: 14px;
    color: #666;
    font-weight: 500;
}

.stat-value {
    font-size: 18px;
    font-weight: 600;
    color: #000;
}

/* Artist Grid */
.artists-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 40px;
}

.artist-card {
    cursor: pointer;
    border-radius: 8px;
    overflow: hidden;
    background: #f5f5f5;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid #e5e5e5;
}

.artist-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.artist-cover-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 182 / 250;
    background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.artist-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s;
    display: block;
    position: relative;
    z-index: 1;
}

.image-placeholder {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #f5f5f5 0%, #efefef 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    font-family: 'Monaco', 'Menlo', monospace;
    z-index: 0;
}

.placeholder-content {
    text-align: center;
    padding: 16px;
}

.placeholder-code {
    font-size: 13px;
    color: #666;
    font-weight: 600;
    display: block;
    margin-bottom: 8px;
}

.placeholder-label {
    font-size: 11px;
    color: #999;
}

.artist-card:hover .artist-cover {
    opacity: 0.85;
}

.artist-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 60%);
    display: flex;
    align-items: flex-end;
    padding: 12px;
    opacity: 0;
    transition: opacity 0.3s;
}

.artist-card:hover .artist-overlay {
    opacity: 1;
}

.artist-info {
    width: 100%;
}

.artist-name {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 4px 0;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.works-count {
    font-size: 12px;
    color: #ddd;
    display: block;
}

.no-results {
    text-align: center;
    padding: 60px 20px;
    color: #999;
    font-size: 16px;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 1000;
    overflow-y: auto;
}

.modal-content,
.detail-modal-content {
    background: #fff;
    border-radius: 8px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    margin: auto;
}

.modal-close {
    position: sticky;
    top: 0;
    right: 0;
    background: #fff;
    border: 1px solid #e5e5e5;
    font-size: 24px;
    cursor: pointer;
    padding: 12px 16px;
    float: right;
    z-index: 1001;
    transition: all 0.2s;
    border-radius: 0 8px 0 0;
}

.modal-close:hover {
    background: #f5f5f5;
    border-color: #999;
}

.modal-header,
.detail-modal-header {
    padding: 24px;
    border-bottom: 1px solid #e5e5e5;
    clear: both;
}

.modal-header h2,
.detail-modal-header h2 {
    font-size: 24px;
    font-weight: 600;
    color: #000;
    margin: 0;
}

.modal-subtitle {
    font-size: 14px;
    color: #666;
    margin: 6px 0 0 0;
}

.modal-body,
.detail-modal-body {
    padding: 24px;
}

/* Works Grid in Modal */
.works-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
}

.work-card {
    cursor: pointer;
    border-radius: 6px;
    overflow: hidden;
    background: #f5f5f5;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid #e5e5e5;
}

.work-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.work-cover {
    position: relative;
    width: 100%;
    aspect-ratio: 182 / 250;
    background: #f0f0f0;
    overflow: hidden;
}

.work-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: opacity 0.2s;
    position: relative;
    z-index: 1;
}

.work-card:hover .work-image {
    opacity: 0.8;
}

.work-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
}

.work-card:hover .work-overlay {
    opacity: 1;
}

.view-label {
    background: #000;
    color: #fff;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
}

.work-code {
    display: block;
    padding: 8px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 10px;
    color: #666;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: #fafafa;
}

/* Detail Cover Section */
.cover-section {
    margin-bottom: 32px;
    text-align: center;
}

.cover-container {
    display: inline-block;
    background: #f0f0f0;
    border-radius: 6px;
    overflow: hidden;
    max-width: 300px;
    position: relative;
}

.detail-cover {
    width: 100%;
    height: auto;
    display: block;
    position: relative;
    z-index: 1;
}

.preview-section {
    margin-top: 32px;
}

.preview-title {
    font-size: 16px;
    font-weight: 600;
    color: #000;
    margin-bottom: 16px;
}

.preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
}

.preview-item {
    position: relative;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
    aspect-ratio: 16 / 9;
}

.preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.preview-num {
    position: absolute;
    bottom: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 600;
}

/* Transition Animations */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}

@media (max-width: 768px) {
    .container {
        padding: 12px;
    }

    .header h1 {
        font-size: 24px;
    }

    .artists-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
    }

    .artist-cover-wrapper {
        aspect-ratio: 182 / 250;
    }

    .modal-content,
    .detail-modal-content {
        max-width: 100%;
        border-radius: 8px;
        max-height: 100vh;
    }

    .works-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px;
    }

    .preview-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px;
    }

    .controls {
        flex-direction: column;
    }

    .filters {
        flex-direction: column;
    }

    .number-input {
        width: 100%;
    }

    .stats {
        flex-direction: column;
        gap: 12px;
    }

    .modal-header,
    .detail-modal-header {
        padding: 16px;
    }

    .modal-body,
    .detail-modal-body {
        padding: 16px;
    }
}

@media (max-width: 480px) {
    .container {
        padding: 8px;
    }

    .header h1 {
        font-size: 20px;
    }

    .artists-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px;
    }

    .artist-name {
        font-size: 11px;
    }

    .works-count {
        font-size: 10px;
    }

    .works-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
    }

    .preview-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
    }

    .work-code {
        padding: 6px;
        font-size: 9px;
    }
}
</style>
// Nama : Mutiara Acintyacitra Nirmala
// NIM  : A12.2023.07059
document.addEventListener('DOMContentLoaded', function() {
    // API URL
    const apiUrl = 'api_mahasiswa.php';
    
    // DOM Elements
    const mahasiswaForm = document.getElementById('mahasiswaForm');
    const mahasiswaTableBody = document.getElementById('mahasiswaTableBody');
    const toggleFormBtn = document.getElementById('toggleForm');
    const formSection = document.getElementById('formSection');
    const submitBtn = document.getElementById('submitBtn');
    const resetFormBtn = document.getElementById('resetForm');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const deleteModalText = document.getElementById('deleteModalText');
    const toastElement = document.getElementById('liveToast');
    const toast = new bootstrap.Toast(toastElement);
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastHeader = document.getElementById('toastHeader');
    const paginationContainer = document.getElementById('pagination-container');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const jurusanSelect = document.getElementById('jurusan');
    const jurusanModal = new bootstrap.Modal(document.getElementById('jurusanModal'));
    const newJurusanInput = document.getElementById('newJurusan');
    const saveJurusanBtn = document.getElementById('saveJurusanBtn');
    
    // State
    let mahasiswaList = [];
    let currentMahasiswaId = null;
    let isEditing = false;
    let currentPage = 1;
    const itemsPerPage = 5; // Jumlah item per halaman
    let jurusanList = [
        "Teknik Informatika",
        "Sistem Informasi",
        "Teknik Komputer",
        "Manajemen Informatika"
    ];
    
    // Fungsi untuk memuat daftar jurusan dari localStorage atau default
    function loadJurusanList() {
        const savedJurusan = localStorage.getItem('jurusanList');
        if (savedJurusan) {
            jurusanList = JSON.parse(savedJurusan);
        }
        populateJurusanDropdown();
    }
    
    // Fungsi untuk mengisi dropdown jurusan
    function populateJurusanDropdown() {
        // Simpan nilai yang terpilih saat ini
        const selectedValue = jurusanSelect.value;
        
        // Hapus semua opsi kecuali placeholder
        while (jurusanSelect.options.length > 1) {
            jurusanSelect.remove(1);
        }
        
        // Tambahkan opsi jurusan dari jurusanList
        jurusanList.forEach(jurusan => {
            const option = document.createElement('option');
            option.value = jurusan;
            option.textContent = jurusan;
            jurusanSelect.appendChild(option);
        });
        
        // Pilih kembali nilai yang sebelumnya terpilih jika masih ada
        if (selectedValue && jurusanList.includes(selectedValue)) {
            jurusanSelect.value = selectedValue;
        }
    }
    
    // Fungsi untuk menambahkan jurusan baru
    function addNewJurusan() {
        const newJurusan = newJurusanInput.value.trim();
        if (newJurusan === '') {
            showToast('Peringatan', 'Nama jurusan tidak boleh kosong', 'warning');
            return;
        }
        
        // Cek jika jurusan sudah ada
        if (jurusanList.includes(newJurusan)) {
            showToast('Info', 'Jurusan tersebut sudah ada dalam daftar', 'warning');
            return;
        }
        
        // Tambahkan jurusan baru
        jurusanList.push(newJurusan);
        
        // Simpan ke localStorage
        localStorage.setItem('jurusanList', JSON.stringify(jurusanList));
        
        // Perbarui dropdown
        populateJurusanDropdown();
        
        // Pilih jurusan baru
        jurusanSelect.value = newJurusan;
        
        // Tutup modal
        jurusanModal.hide();
        
        // Bersihkan input
        newJurusanInput.value = '';
        
        // Tampilkan notifikasi
        showToast('Sukses', `Jurusan "${newJurusan}" berhasil ditambahkan`, 'success');
    }
    
    // Fetch all mahasiswa data
    function fetchMahasiswa() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                mahasiswaList = data;
                renderMahasiswaTable(mahasiswaList);
                
                // Update jurusan list dengan jurusan yang ada di data
                data.forEach(mahasiswa => {
                    if (mahasiswa.jurusan && !jurusanList.includes(mahasiswa.jurusan)) {
                        jurusanList.push(mahasiswa.jurusan);
                    }
                });
                
                // Simpan jurusan terbaru ke localStorage
                localStorage.setItem('jurusanList', JSON.stringify(jurusanList));
                
                // Perbarui dropdown
                populateJurusanDropdown();
            })
            .catch(error => {
                showToast('Error', `Gagal memuat data: ${error.message}`, 'error');
            });
    }
    
    // Render mahasiswa table
    function renderMahasiswaTable(data) {
        if (data.length === 0) {
            mahasiswaTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data mahasiswa</td></tr>';
            paginationContainer.style.display = 'none';
            return;
        }
        
        // Calculate pagination
        const totalPages = Math.ceil(data.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, data.length);
        const currentPageData = data.slice(startIndex, endIndex);
        
        mahasiswaTableBody.innerHTML = '';
        
        currentPageData.forEach(mahasiswa => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${mahasiswa.id}</td>
                <td>${mahasiswa.nim}</td>
                <td>${mahasiswa.nama}</td>
                <td>${mahasiswa.jurusan}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${mahasiswa.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${mahasiswa.id}" data-nama="${mahasiswa.nama}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            mahasiswaTableBody.appendChild(row);
        });
        
        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEdit);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });
        
        // Render pagination controls
        renderPagination(data.length, totalPages);
    }
    
    // Render pagination
    function renderPagination(totalItems, totalPages) {
        if (totalItems <= itemsPerPage) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        pageNumbers.innerHTML = '';
        
        // Enable/disable previous button
        prevPageBtn.disabled = currentPage === 1;
        
        // Enable/disable next button
        nextPageBtn.disabled = currentPage === totalPages;
        
        // Determine which page numbers to show
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Add first page button if not in range
        if (startPage > 1) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'btn btn-sm btn-outline-primary';
            pageBtn.textContent = '1';
            pageBtn.addEventListener('click', () => goToPage(1));
            pageNumbers.appendChild(pageBtn);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('button');
                ellipsis.className = 'btn btn-sm btn-outline-primary disabled';
                ellipsis.textContent = '...';
                ellipsis.disabled = true;
                pageNumbers.appendChild(ellipsis);
            }
        }
        
        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => goToPage(i));
            pageNumbers.appendChild(pageBtn);
        }
        
        // Add last page button if not in range
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('button');
                ellipsis.className = 'btn btn-sm btn-outline-primary disabled';
                ellipsis.textContent = '...';
                ellipsis.disabled = true;
                pageNumbers.appendChild(ellipsis);
            }
            
            const pageBtn = document.createElement('button');
            pageBtn.className = 'btn btn-sm btn-outline-primary';
            pageBtn.textContent = totalPages;
            pageBtn.addEventListener('click', () => goToPage(totalPages));
            pageNumbers.appendChild(pageBtn);
        }
    }
    
    // Go to specific page
    function goToPage(page) {
        currentPage = page;
        renderMahasiswaTable(mahasiswaList);
    }
    
    // Create or update mahasiswa
    function saveMahasiswa(event) {
        event.preventDefault();
        
        const nim = document.getElementById('nim').value;
        const nama = document.getElementById('nama').value;
        const jurusan = document.getElementById('jurusan').value;
        const newId = document.getElementById('new_id').value; // Added for ID editing
        
        if (jurusan === '') {
            showToast('Peringatan', 'Silakan pilih jurusan', 'warning');
            return;
        }
        
        const data = { nim, nama, jurusan };
        
        // Add new_id to data if it's provided and different from current ID
        if (isEditing && newId.trim() !== '' && newId !== currentMahasiswaId) {
            data.new_id = newId;
        }
        
        if (isEditing) {
            // Update existing mahasiswa
            updateMahasiswa(currentMahasiswaId, data);
        } else {
            // Create new mahasiswa
            createMahasiswa(data);
        }
    }
    
    // Create new mahasiswa
    function createMahasiswa(data) {
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.status) {
                showToast('Sukses', 'Data mahasiswa berhasil ditambahkan', 'success');
                
                // Check if jurusan is new
                if (!jurusanList.includes(data.jurusan)) {
                    jurusanList.push(data.jurusan);
                    localStorage.setItem('jurusanList', JSON.stringify(jurusanList));
                    populateJurusanDropdown();
                }
                
                resetForm();
                fetchMahasiswa();
            } else {
                showToast('Error', result.message, 'error');
            }
        })
        .catch(error => {
            showToast('Error', `Gagal menambahkan data: ${error.message}`, 'error');
        });
    }
    
    // Update existing mahasiswa
    function updateMahasiswa(id, data) {
        fetch(`${apiUrl}?id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.status) {
                showToast('Sukses', 'Data mahasiswa berhasil diupdate', 'success');
                
                // Check if jurusan is new
                if (!jurusanList.includes(data.jurusan)) {
                    jurusanList.push(data.jurusan);
                    localStorage.setItem('jurusanList', JSON.stringify(jurusanList));
                    populateJurusanDropdown();
                }
                
                resetForm();
                fetchMahasiswa();
            } else {
                showToast('Error', result.message, 'error');
            }
        })
        .catch(error => {
            showToast('Error', `Gagal mengupdate data: ${error.message}`, 'error');
        });
    }
    
    // Delete mahasiswa
    function deleteMahasiswa(id) {
        fetch(`${apiUrl}?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.status) {
                showToast('Sukses', 'Data mahasiswa berhasil dihapus', 'success');
                fetchMahasiswa();
            } else {
                showToast('Error', result.message, 'error');
            }
        })
        .catch(error => {
            showToast('Error', `Gagal menghapus data: ${error.message}`, 'error');
        });
    }
    
    // Handle edit button click
    function handleEdit(event) {
        const id = event.currentTarget.dataset.id;
        currentMahasiswaId = id;
        isEditing = true;
        
        // Find mahasiswa data
        const mahasiswa = mahasiswaList.find(m => m.id === id);
        
        if (mahasiswa) {
            // Show form and fill with data
            formSection.style.display = 'block';
            document.getElementById('mahasiswaId').value = mahasiswa.id;
            document.getElementById('new_id').value = mahasiswa.id; // Fill the new ID field with current ID
            document.getElementById('nim').value = mahasiswa.nim;
            document.getElementById('nama').value = mahasiswa.nama;
            
            // Show the ID edit field when editing
            document.getElementById('id_edit_group').style.display = 'block';
            
            // Check if jurusan exists in dropdown, if not add it
            if (!jurusanList.includes(mahasiswa.jurusan)) {
                jurusanList.push(mahasiswa.jurusan);
                localStorage.setItem('jurusanList', JSON.stringify(jurusanList));
                populateJurusanDropdown();
            }
            
            document.getElementById('jurusan').value = mahasiswa.jurusan;
            
            // Change button text
            submitBtn.textContent = 'Update';
            
            // Scroll to form
            formSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Handle delete button click
    function handleDelete(event) {
        const id = event.currentTarget.dataset.id;
        const nama = event.currentTarget.dataset.nama;
        
        currentMahasiswaId = id;
        deleteModalText.textContent = `ID: ${id}, Nama: ${nama}`;
        deleteModal.show();
    }
    
    // Reset form
    function resetForm() {
        mahasiswaForm.reset();
        currentMahasiswaId = null;
        isEditing = false;
        submitBtn.textContent = 'Simpan';
        document.getElementById('id_edit_group').style.display = 'none'; // Hide ID edit field when not editing
    }
    
    // Show toast notification
    function showToast(title, message, type) {
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        // Set header color based on type
        toastHeader.className = 'toast-header';
        if (type === 'success') {
            toastHeader.classList.add('bg-success', 'text-white');
        } else if (type === 'error') {
            toastHeader.classList.add('bg-danger', 'text-white');
        } else if (type === 'warning') {
            toastHeader.classList.add('bg-warning', 'text-dark');
        }
        
        toast.show();
    }
    
    // Search mahasiswa
    function searchMahasiswa() {
        const searchValue = searchInput.value.toLowerCase();
        
        if (searchValue.trim() === '') {
            renderMahasiswaTable(mahasiswaList);
            return;
        }
        
        const filteredData = mahasiswaList.filter(mahasiswa => 
            mahasiswa.nim.toLowerCase().includes(searchValue) ||
            mahasiswa.nama.toLowerCase().includes(searchValue) ||
            mahasiswa.jurusan.toLowerCase().includes(searchValue)
        );
        
        currentPage = 1; // Reset to first page when searching
        renderMahasiswaTable(filteredData);
    }
    
    // Event Listeners
    mahasiswaForm.addEventListener('submit', saveMahasiswa);
    
    toggleFormBtn.addEventListener('click', function() {
        if (formSection.style.display === 'none' || formSection.style.display === '') {
            formSection.style.display = 'block';
            toggleFormBtn.innerHTML = '<i class="fas fa-minus-circle"></i> Form';
            // Ensure ID edit field is hidden when opening form for new entry
            if (!isEditing) {
                document.getElementById('id_edit_group').style.display = 'none';
            }
        } else {
            formSection.style.display = 'none';
            toggleFormBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Form';
            resetForm();
        }
    });
    
    resetFormBtn.addEventListener('click', function() {
        resetForm();
        if (isEditing) {
            submitBtn.textContent = 'Simpan';
            isEditing = false;
        }
    });
    
    confirmDeleteBtn.addEventListener('click', function() {
        if (currentMahasiswaId) {
            deleteMahasiswa(currentMahasiswaId);
            deleteModal.hide();
        }
    });
    
    searchBtn.addEventListener('click', searchMahasiswa);
    
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchMahasiswa();
        }
    });
    
    refreshBtn.addEventListener('click', function() {
        searchInput.value = '';
        currentPage = 1; // Reset to first page when refreshing
        fetchMahasiswa();
    });
    
    // Pagination event listeners
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderMahasiswaTable(mahasiswaList);
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(mahasiswaList.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderMahasiswaTable(mahasiswaList);
        }
    });
    
    // Add jurusan event listener
    saveJurusanBtn.addEventListener('click', addNewJurusan);
    
    // Handle Enter key in new jurusan input
    newJurusanInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            addNewJurusan();
        }
    });
    
    // Load jurusan list when jurusan modal is shown
    document.getElementById('jurusanModal').addEventListener('shown.bs.modal', function() {
        newJurusanInput.focus();
    });
    
    // Initial load
    loadJurusanList();
    fetchMahasiswa();
    
    // Initial hide of ID edit field
    document.getElementById('id_edit_group').style.display = 'none';
});
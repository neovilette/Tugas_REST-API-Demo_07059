// Nama : Mutiara Acintyacitra Nirmala
// NIM  : A12.2023.07059
document.addEventListener('DOMContentLoaded', function() {
    // API URL
    const apiUrl = 'api_buku.php';
    
    // DOM Elements
    const bukuForm = document.getElementById('bukuForm');
    const bukuTableBody = document.getElementById('bukuTableBody');
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
    
    // State
    let bukuList = [];
    let currentBukuId = null;
    let isEditing = false;
    let currentPage = 1;
    const itemsPerPage = 5;// Jumlah item per halaman
    
    // Fetch all buku data
    function fetchBuku() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                bukuList = data;
                renderBukuTable(bukuList);
            })
            .catch(error => {
                showToast('Error', `Gagal memuat data: ${error.message}`, 'error');
            });
    }
    
    // Render buku table
    function renderBukuTable(data) {
        if (data.length === 0) {
            bukuTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data buku</td></tr>';
            paginationContainer.style.display = 'none';
            return;
        }
        
        // Calculate pagination
        const totalPages = Math.ceil(data.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, data.length);
        const currentPageData = data.slice(startIndex, endIndex);
        
        bukuTableBody.innerHTML = '';
        
        currentPageData.forEach(buku => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${buku.id}</td>
                <td>${buku.judul}</td>
                <td>${buku.penulis}</td>
                <td>${buku.tahun_terbit}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${buku.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${buku.id}" data-judul="${buku.judul}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            bukuTableBody.appendChild(row);
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
            pageBtn.className = 'btn btn-sm btn-outline-success';
            pageBtn.textContent = '1';
            pageBtn.addEventListener('click', () => goToPage(1));
            pageNumbers.appendChild(pageBtn);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('button');
                ellipsis.className = 'btn btn-sm btn-outline-success disabled';
                ellipsis.textContent = '...';
                ellipsis.disabled = true;
                pageNumbers.appendChild(ellipsis);
            }
        }
        
        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `btn btn-sm ${i === currentPage ? 'btn-success' : 'btn-outline-success'}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => goToPage(i));
            pageNumbers.appendChild(pageBtn);
        }
        
        // Add last page button if not in range
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('button');
                ellipsis.className = 'btn btn-sm btn-outline-success disabled';
                ellipsis.textContent = '...';
                ellipsis.disabled = true;
                pageNumbers.appendChild(ellipsis);
            }
            
            const pageBtn = document.createElement('button');
            pageBtn.className = 'btn btn-sm btn-outline-success';
            pageBtn.textContent = totalPages;
            pageBtn.addEventListener('click', () => goToPage(totalPages));
            pageNumbers.appendChild(pageBtn);
        }
    }
    
    // Go to specific page
    function goToPage(page) {
        currentPage = page;
        renderBukuTable(bukuList);
    }
    
    // Create or update buku
    function saveBuku(event) {
        event.preventDefault();
        
        const judul = document.getElementById('judul').value;
        const penulis = document.getElementById('penulis').value;
        const tahun_terbit = document.getElementById('tahun_terbit').value;
        const newId = document.getElementById('bukuId').value.trim();
        
        const data = { judul, penulis, tahun_terbit };
        if (newId) {
            data.new_id = newId;
        }
        
        if (isEditing) {
            // Update existing buku
            updateBuku(currentBukuId, data);
        } else {
            // Create new buku
            if (newId) {
                data.id = newId; // Untuk membuat data baru dengan ID yang spesifik
            }
            createBuku(data);
        }
    }
    
    // Create new buku
    function createBuku(data) {
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
                showToast('Sukses', 'Data buku berhasil ditambahkan', 'success');
                resetForm();
                fetchBuku();
            } else {
                showToast('Error', result.message || 'Gagal menambahkan data', 'error');
            }
        })
        .catch(error => {
            showToast('Error', `Gagal menambahkan data: ${error.message}`, 'error');
        });
    }
    
    // Update existing buku
    function updateBuku(id, data) {
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
                showToast('Sukses', 'Data buku berhasil diupdate', 'success');
                resetForm();
                fetchBuku();
            } else {
                showToast('Error', result.message || 'Gagal mengupdate data', 'error');
            }
        })
        .catch(error => {
            showToast('Error', `Gagal mengupdate data: ${error.message}`, 'error');
        });
    }
    
    // Delete buku
    function deleteBuku(id) {
        fetch(`${apiUrl}?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.status) {
                showToast('Sukses', 'Data buku berhasil dihapus', 'success');
                fetchBuku();
            } else {
                showToast('Error', result.message || 'Gagal menghapus data', 'error');
            }
        })
        .catch(error => {
            showToast('Error', `Gagal menghapus data: ${error.message}`, 'error');
        });
    }
    
    // Handle edit button click
    function handleEdit(event) {
        const id = event.currentTarget.dataset.id;
        currentBukuId = id;
        isEditing = true;
        
        // Find buku data
        const buku = bukuList.find(b => b.id === id);
        
        if (buku) {
            // Show form and fill with data
            formSection.style.display = 'block';
            document.getElementById('bukuId').value = buku.id;
            document.getElementById('judul').value = buku.judul;
            document.getElementById('penulis').value = buku.penulis;
            document.getElementById('tahun_terbit').value = buku.tahun_terbit;
            
            // Change button text
            submitBtn.textContent = 'Update';
            
            // Scroll to form
            formSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Handle delete button click
    function handleDelete(event) {
        const id = event.currentTarget.dataset.id;
        const judul = event.currentTarget.dataset.judul;
        
        currentBukuId = id;
        deleteModalText.textContent = `ID: ${id}, Judul: ${judul}`;
        deleteModal.show();
    }
    
    // Reset form
    function resetForm() {
        bukuForm.reset();
        currentBukuId = null;
        isEditing = false;
        submitBtn.textContent = 'Simpan';
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
    
    // Search buku
    function searchBuku() {
        const searchValue = searchInput.value.toLowerCase();
        
        if (searchValue.trim() === '') {
            renderBukuTable(bukuList);
            return;
        }
        
        const filteredData = bukuList.filter(buku => 
            buku.judul.toLowerCase().includes(searchValue) ||
            buku.penulis.toLowerCase().includes(searchValue) ||
            buku.tahun_terbit.toString().includes(searchValue) ||
            buku.id.toString().includes(searchValue) // Tambahkan pencarian berdasarkan ID
        );
        
        currentPage = 1; // Reset to first page when searching
        renderBukuTable(filteredData);
    }
    
    // Event Listeners
    bukuForm.addEventListener('submit', saveBuku);
    
    toggleFormBtn.addEventListener('click', function() {
        if (formSection.style.display === 'none' || formSection.style.display === '') {
            formSection.style.display = 'block';
            toggleFormBtn.innerHTML = '<i class="fas fa-minus-circle"></i> Form';
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
        if (currentBukuId) {
            deleteBuku(currentBukuId);
            deleteModal.hide();
        }
    });
    
    searchBtn.addEventListener('click', searchBuku);
    
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchBuku();
        }
    });
    
    refreshBtn.addEventListener('click', function() {
        searchInput.value = '';
        currentPage = 1; // Reset to first page when refreshing
        fetchBuku();
    });
    
    // Pagination event listeners
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderBukuTable(bukuList);
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(bukuList.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderBukuTable(bukuList);
        }
    });
    
    // Initial fetch
    fetchBuku();
});
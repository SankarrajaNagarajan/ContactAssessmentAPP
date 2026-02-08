import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Contact } from '../../../../../core/models/contact.model';
import { ContactService } from '../../../../../core/services/contact.service';
import { AddContactComponent } from '../../../../../shared/components/add-contact/add-contact.component';
import { EditContactComponent } from '../../../../../shared/components/edit-contact/edit-contact.component';
import { DeleteContactComponent } from '../../../../../shared/components/delete-contact/delete-contact.component';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './contact-list.html',
  styleUrls: ['./contact-list.scss']
})
export class ContactList implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Contact>();
  displayedColumns: string[] = ['select', 'firstName', 'lastName', 'email', 'phoneNumber', 'city', 'state', 'actions'];

  contacts: Contact[] = [];
  loading = false;
  selectedContacts = new Set<number | string>();

  // Pagination
  pageSize = 10;

  searchFilters = {
    name: '',
    phone: '',
    email: ''
  };

  constructor(
    private contactService: ContactService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  ngAfterViewInit(): void {
    // Provide a robust accessor:
    // - sort "Name" by combined first+last
    // - handle null/undefined
    // - case-insensitive for strings
    // - numeric sorting for numeric-like values
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      if (!item) return '';

      // Sort "Name" column (firstName header) by full name (first + last)
      if (property === 'firstName') {
        const first = item.firstName || '';
        const last = item.lastName || '';
        return (first + ' ' + last).toString().toLowerCase();
      }

      const value = item[property];

      if (value == null) return '';

      // If value looks numeric, return number for numeric sort
      const num = Number(value);
      if (!isNaN(num) && value !== '' && typeof value !== 'object') {
        return num;
      }

      // Default: string lower-cased
      return typeof value === 'string' ? value.toLowerCase() : value;
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadContacts(): void {
    this.loading = true;
    this.contactService.getContacts().subscribe({
      next: (response: any) => {
        this.contacts = response.items || [];
        this.dataSource.data = this.contacts;

        // Re-assign sort after async data load to ensure sorting hooks are active
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }

        // Force datasource to refresh internal subscriptions so sorting/pagination update
        // Note: _updateChangeSubscription is commonly used to refresh the table after programmatic changes
        (this.dataSource as any)._updateChangeSubscription?.();

        if (this.paginator) {
          this.paginator.firstPage();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading contacts', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const filtered = this.contacts.filter(contact => {
      const firstName = (contact.firstName || '').toLowerCase();
      const lastName = (contact.lastName || '').toLowerCase();
      const email = (contact.email || '').toLowerCase();
      const phone = (contact.phoneNumber || '').toLowerCase();
      const searchTerm = this.searchFilters.name.toLowerCase();

      return (
        firstName.includes(searchTerm) ||
        lastName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        phone.includes(searchTerm)
      );
    });

    this.dataSource.data = filtered;
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.searchFilters = {
      name: '',
      phone: '',
      email: ''
    };
    this.applyFilters();
  }

  onSearchInput(): void {
    this.applyFilters();
  }

  // Helper Methods
  getInitials(firstName: string | undefined, lastName: string | undefined): string {
    const first = firstName?.charAt(0).toUpperCase() || '';
    const last = lastName?.charAt(0).toUpperCase() || '';
    return (first + last).substring(0, 2) || 'U';
  }

  getCompanyName(contact: Contact): string {
    // This can be extended to use a company field if added to the model
    // For now, returning empty string
    return '';
  }

  // getCompanyClass(contact: Contact): string {
  //   const companies: { [key: string]: string } = {
  //     'microsoft': 'company-microsoft',
  //     'google': 'company-google',
  //     'apple': 'company-apple',
  //     'amazon': 'company-amazon'
  //   };
    
  //   const company = this.getCompanyName(contact).toLowerCase();
  //   return companies[company] || 'company-default';
  // }

  // Selection Methods
  toggleSelectAll(event: any): void {
    if (event.checked) {
      this.dataSource.data.forEach(contact => {
        if (contact.id) this.selectedContacts.add(contact.id);
      });
    } else {
      this.selectedContacts.clear();
    }
  }

  toggleSelectContact(contactId: string | number | undefined): void {
    if (!contactId) return;

    if (this.selectedContacts.has(contactId)) {
      this.selectedContacts.delete(contactId);
    } else {
      this.selectedContacts.add(contactId);
    }
  }

  isContactSelected(contactId: string | number | undefined): boolean {
    return contactId ? this.selectedContacts.has(contactId) : false;
  }

  isAllSelected(): boolean {
    return (
      this.dataSource.data.length > 0 &&
      this.dataSource.data.every(contact => this.isContactSelected(contact.id))
    );
  }

  // Open Add Contact Modal
  openAddModal(): void {
    const modalRef = this.modalService.open(AddContactComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
      keyboard: false,
      windowClass: 'modal-custom-size'
    });

    modalRef.result
      .then(result => {
        if (result) {
          this.loadContacts();
        }
      })
      .catch(() => {});
  }

  // Open Edit Contact Modal
  openEditModal(contact: Contact): void {
    const modalRef = this.modalService.open(EditContactComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
      keyboard: false,
      windowClass: 'modal-custom-size'
    });

    modalRef.componentInstance.contact = { ...contact };

    modalRef.result
      .then(result => {
        if (result) {
          this.loadContacts();
        }
      })
      .catch(() => {});
  }

  // Open Delete Contact Modal
  deleteContact(contact: Contact): void {
    const modalRef = this.modalService.open(DeleteContactComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true,
      keyboard: false,
      windowClass: 'modal-custom-size'
    });

    modalRef.componentInstance.contact = contact;

    modalRef.result
      .then(result => {
        if (result) {
          this.selectedContacts.delete(contact.id!);
          this.loadContacts();
        }
      })
      .catch(() => {});
  }
}


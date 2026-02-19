import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ContactList } from '../contact-list/contact-list/contact-list';
import { ContactService } from '../../../../core/services/contact.service';
import { BsModalService } from 'ngx-bootstrap/modal';

describe('ContactListComponent', () => {
  let component: ContactList;
  let fixture: ComponentFixture<ContactList>;
  let mockContactService: jasmine.SpyObj<ContactService>;
  let mockModalService: jasmine.SpyObj<BsModalService>;

  const mockContacts = [
    {
      id: 1,
      firstName: 'raja',
      lastName: 'sankar',
      email: 'raja@mail.com',
      phoneNumber: '693636564',
      city: 'salem',
      state: 'TN',
      address: '123,test',
      country: 'INR',
      postalCode: '636009'
    }
  ];

  beforeEach(async () => {
    mockContactService = jasmine.createSpyObj('ContactService', ['getContacts']);
    mockModalService = jasmine.createSpyObj('BsModalService', ['show']);

    await TestBed.configureTestingModule({
      declarations: [ContactList],
      imports: [
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        BrowserAnimationsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ContactService, useValue: mockContactService },
        { provide: BsModalService, useValue: mockModalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContactList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load contacts on init', () => {
      mockContactService.getContacts.and.returnValue(of(mockContacts));
      
      component.ngOnInit();
      
      expect(mockContactService.getContacts).toHaveBeenCalled();
      expect(component.dataSource.data).toEqual(mockContacts);
      expect(component.loading).toBeFalse();
    });

    it('should show loading state initially', () => {
      expect(component.loading).toBeTrue();
    });
  });

  describe('Add Modal', () => {
    it('should open add modal when Add Contact button clicked', () => {
      const openSpy = spyOn(component, 'openAddModal');
      
      const addButton = fixture.debugElement.nativeElement.querySelector('button[mat-raised-button]');
      addButton.click();
      
      expect(openSpy).toHaveBeenCalled();
      expect(mockModalService.show).toHaveBeenCalledWith(
        jasmine.anything(), 
        jasmine.objectContaining({ backdrop: 'static' })
      );
    });
  });

  describe('Selection', () => {
    beforeEach(() => {
      mockContactService.getContacts.and.returnValue(of(mockContacts));
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should toggle all contacts selection', fakeAsync(() => {
      component.toggleSelectAll({ checked: true } as any);
      tick();
      
      expect(component.isAllSelected()).toBeTrue();
      expect(component.selectedContacts.size).toBe(1);
    }));

    it('should toggle individual contact selection', () => {
      component.toggleSelectContact(1);
      
      expect(component.isContactSelected(1)).toBeTrue();
      expect(component.selectedContacts.has(1)).toBeTrue();
    });

    it('should check if contact is selected', () => {
      component.selectedContacts.add(1);
      
      expect(component.isContactSelected(1)).toBeTrue();
      expect(component.isContactSelected(2)).toBeFalse();
    });
  });

  describe('Edit Modal', () => {
    it('should open edit modal with contact data', () => {
      const contact = mockContacts[0];
      spyOn(component, 'openEditModal');
      
      component.openEditModal(contact);
      
      expect(mockModalService.show).toHaveBeenCalled();
      expect(component.modalRef?.componentInstance?.contact).toEqual(contact);
    });
  });

  describe('Delete Contact', () => {
    it('should confirm delete before calling service', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockContactService.deleteContact.and.returnValue(of(void 0));
      
      component.deleteContact(mockContacts[0]);
      
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this contact?');
      expect(mockContactService.deleteContact).toHaveBeenCalledWith(1);
    });
  });

  describe('UI States', () => {
    it('should show loading spinner when loading', () => {
      component.loading = true;
      fixture.detectChanges();
      
      const spinner = fixture.debugElement.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should show empty state when no contacts', () => {
      component.loading = false;
      component.dataSource.data = [];
      fixture.detectChanges();
      
      const emptyState = fixture.debugElement.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('should show table when contacts loaded', () => {
      mockContactService.getContacts.and.returnValue(of(mockContacts));
      component.ngOnInit();
      fixture.detectChanges();
      
      const table = fixture.debugElement.nativeElement.querySelector('mat-table');
      expect(table).toBeTruthy();
    });
  });

  describe('Avatar Initials', () => {
    it('should generate correct initials', () => {
      expect(component.getInitials('John', 'Doe')).toBe('JD');
      expect(component.getInitials('Mary', '')).toBe('M');
      expect(component.getInitials('', 'Smith')).toBe('S');
    });
  });

  describe('Table Rendering', () => {
    beforeEach(() => {
      mockContactService.getContacts.and.returnValue(of(mockContacts));
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should render correct number of rows', () => {
      const rows = fixture.debugElement.nativeElement.querySelectorAll('tr.mat-row');
      expect(rows.length).toBe(1);
    });

    it('should display contact data correctly', () => {
      const firstNameCell = fixture.debugElement.nativeElement.querySelector('.name-text strong');
      expect(firstNameCell?.textContent.trim()).toContain('John Doe');
    });

    it('should have correct column headers', () => {
      const headers = fixture.debugElement.nativeElement.querySelectorAll('th');
      expect(headers[1].textContent.trim()).toBe('First Name');
      expect(headers[2].textContent.trim()).toBe('Last Name');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', () => {
      const error = new Error('API Error');
      mockContactService.getContacts.and.returnValue(
        throwError(() => error)
      );
      
      component.ngOnInit();
      
      expect(component.loading).toBeFalse();
      expect(component.dataSource.data.length).toBe(0);
    });
  });
});
